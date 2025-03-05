import { db } from "./db"

// Hàm lấy token hoạt động từ database, ưu tiên token gần nhất
async function getDigitalOceanToken() {
  const tokenRecord = await db.digitalOceanToken.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  })
  
  if (!tokenRecord) {
    throw new Error("DigitalOcean API token not found")
  }
  
  return tokenRecord.token
}

// Các loại lỗi cụ thể từ DigitalOcean API
export const DigitalOceanErrors = {
  UNAUTHORIZED: 'UNAUTHORIZED', // Token không hợp lệ hoặc hết hạn
  RATE_LIMIT: 'RATE_LIMIT',     // Quá nhiều request
  NOT_FOUND: 'NOT_FOUND',       // Tài nguyên không tồn tại
  SERVER_ERROR: 'SERVER_ERROR', // Lỗi server của DigitalOcean
  NETWORK_ERROR: 'NETWORK_ERROR', // Lỗi kết nối mạng
  UNKNOWN: 'UNKNOWN'            // Các lỗi khác
}

// Cấu trúc kết quả API chi tiết
export interface DigitalOceanResult<T> {
  data: T | null;
  error: {
    type: string;
    message: string;
    status?: number;
  } | null;
}

// Hàm sleep để delay giữa các lần retry
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Hàm gọi API DigitalOcean với retry logic và xử lý lỗi chi tiết
export async function callDigitalOceanAPI<T = any>(
  endpoint: string, 
  method = "GET", 
  body?: any,
  retries = 3,
  customToken?: string
): Promise<T> {
  let lastError: any = null;
  let retryCount = 0;
  
  while (retryCount < retries) {
    try {
      // Sử dụng token được truyền vào hoặc lấy từ database
      const token = customToken || await getDigitalOceanToken();
      
      const response = await fetch(`https://api.digitalocean.com/v2${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      // Xử lý các mã lỗi HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        
        // Xác định loại lỗi
        let errorType: string;
        switch (response.status) {
          case 401:
            errorType = DigitalOceanErrors.UNAUTHORIZED;
            // Không retry lỗi xác thực - token không hợp lệ
            throw new Error(`DigitalOcean API error: Unauthorized - Token is invalid or expired`);
          case 404:
            errorType = DigitalOceanErrors.NOT_FOUND;
            throw new Error(`DigitalOcean API error: Resource not found - ${response.statusText}`);
          case 429:
            errorType = DigitalOceanErrors.RATE_LIMIT;
            // Đây là lỗi rate limit, chúng ta sẽ retry sau một khoảng thời gian
            lastError = new Error(`DigitalOcean API error: Rate limit exceeded`);
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorType = DigitalOceanErrors.SERVER_ERROR;
            // Lỗi server, có thể retry
            lastError = new Error(`DigitalOcean API server error: ${response.status} ${response.statusText}`);
            break;
          default:
            errorType = DigitalOceanErrors.UNKNOWN;
            lastError = new Error(`DigitalOcean API error: ${response.status} ${response.statusText}`);
        }
        
        // Nếu là lỗi có thể retry, chúng ta sẽ thử lại
        if (
          errorType === DigitalOceanErrors.RATE_LIMIT || 
          errorType === DigitalOceanErrors.SERVER_ERROR
        ) {
          // Tăng thời gian chờ theo cấp số nhân (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          console.log(`Retrying DigitalOcean API call in ${delay}ms...`);
          await sleep(delay);
          retryCount++;
          continue;
        }
        
        // Nếu đến đây nghĩa là lỗi không thể retry, ném ra
        throw lastError;
      }
      
      // Nếu response ok, parse dữ liệu và trả về
      return await response.json();
      
    } catch (error: any) {
      // Xử lý lỗi mạng
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        lastError = new Error(`DigitalOcean API network error: ${error.message}`);
        
        // Retry lỗi mạng
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        console.log(`Network error, retrying in ${delay}ms...`);
        await sleep(delay);
        retryCount++;
        continue;
      }
      
      // Các lỗi khác không retry, ném ra luôn
      throw error;
    }
  }
  
  // Nếu đã retry đủ số lần mà vẫn lỗi
  throw lastError || new Error('Failed to connect to DigitalOcean API after multiple retries');
}

// Hàm kiểm tra token có hợp lệ không
export async function testDigitalOceanToken(token: string): Promise<{
  isValid: boolean;
  message: string;
  details?: any;
}> {
  try {
    const data = await callDigitalOceanAPI('/account', 'GET', undefined, 1, token);
    return {
      isValid: true,
      message: 'Token is valid',
      details: data
    };
  } catch (error: any) {
    let message = 'Token is invalid';
    
    if (error.message?.includes('Unauthorized')) {
      message = 'Token is invalid or has been revoked';
    } else if (error.message?.includes('network error')) {
      message = 'Could not connect to DigitalOcean API. Please check your internet connection';
    } else if (error.message?.includes('Rate limit')) {
      message = 'Rate limit exceeded. Please try again later';
    }
    
    return {
      isValid: false,
      message: message,
      details: error.message
    };
  }
}

// Các loại dữ liệu cho Firewall API
export type FirewallRule = {
  protocol: string;
  ports?: string;
  addresses?: {
    addresses?: string[];
    droplet_ids?: number[];
    load_balancer_uids?: string[];
    kubernetes_ids?: string[];
    tags?: string[];
  };
};

export type InboundRule = FirewallRule;
export type OutboundRule = FirewallRule;

export type Firewall = {
  id?: string;
  name: string;
  status?: string;
  created_at?: string;
  inbound_rules: InboundRule[];
  outbound_rules: OutboundRule[];
  droplet_ids?: number[];
  tags?: string[];
};

// Lấy danh sách tất cả firewalls
export async function getFirewalls(): Promise<Firewall[]> {
  try {
    const data = await callDigitalOceanAPI<{ firewalls: Firewall[] }>('/firewalls');
    return data.firewalls || [];
  } catch (error: any) {
    console.error("Error fetching firewalls:", error);
    throw new Error(`Failed to fetch firewalls: ${error.message}`);
  }
}

// Lấy thông tin chi tiết của một firewall
export async function getFirewall(id: string): Promise<Firewall> {
  try {
    const data = await callDigitalOceanAPI<{ firewall: Firewall }>(`/firewalls/${id}`);
    return data.firewall;
  } catch (error: any) {
    console.error(`Error fetching firewall ${id}:`, error);
    throw new Error(`Failed to fetch firewall: ${error.message}`);
  }
}

// Tạo một firewall mới
export async function createFirewall(firewallData: Firewall): Promise<Firewall> {
  try {
    const data = await callDigitalOceanAPI<{ firewall: Firewall }>(
      '/firewalls',
      'POST',
      firewallData
    );
    return data.firewall;
  } catch (error: any) {
    console.error("Error creating firewall:", error);
    throw new Error(`Failed to create firewall: ${error.message}`);
  }
}

// Cập nhật thông tin firewall
export async function updateFirewall(id: string, firewallData: Firewall): Promise<Firewall> {
  try {
    const data = await callDigitalOceanAPI<{ firewall: Firewall }>(
      `/firewalls/${id}`,
      'PUT',
      firewallData
    );
    return data.firewall;
  } catch (error: any) {
    console.error(`Error updating firewall ${id}:`, error);
    throw new Error(`Failed to update firewall: ${error.message}`);
  }
}

// Xóa một firewall
export async function deleteFirewall(id: string): Promise<void> {
  try {
    await callDigitalOceanAPI(`/firewalls/${id}`, 'DELETE');
  } catch (error: any) {
    console.error(`Error deleting firewall ${id}:`, error);
    throw new Error(`Failed to delete firewall: ${error.message}`);
  }
}

// Thêm droplets vào firewall
export async function addDropletsToFirewall(firewallId: string, dropletIds: number[]): Promise<void> {
  try {
    await callDigitalOceanAPI(
      `/firewalls/${firewallId}/droplets`,
      'POST',
      { droplet_ids: dropletIds }
    );
  } catch (error: any) {
    console.error(`Error adding droplets to firewall ${firewallId}:`, error);
    throw new Error(`Failed to add droplets to firewall: ${error.message}`);
  }
}

// Xóa droplets khỏi firewall
export async function removeDropletsFromFirewall(firewallId: string, dropletIds: number[]): Promise<void> {
  try {
    await callDigitalOceanAPI(
      `/firewalls/${firewallId}/droplets`,
      'DELETE',
      { droplet_ids: dropletIds }
    );
  } catch (error: any) {
    console.error(`Error removing droplets from firewall ${firewallId}:`, error);
    throw new Error(`Failed to remove droplets from firewall: ${error.message}`);
  }
}

// Thêm tags vào firewall
export async function addTagsToFirewall(firewallId: string, tags: string[]): Promise<void> {
  try {
    await callDigitalOceanAPI(
      `/firewalls/${firewallId}/tags`,
      'POST',
      { tags }
    );
  } catch (error: any) {
    console.error(`Error adding tags to firewall ${firewallId}:`, error);
    throw new Error(`Failed to add tags to firewall: ${error.message}`);
  }
}

// Xóa tags khỏi firewall
export async function removeTagsFromFirewall(firewallId: string, tags: string[]): Promise<void> {
  try {
    await callDigitalOceanAPI(
      `/firewalls/${firewallId}/tags`,
      'DELETE',
      { tags }
    );
  } catch (error: any) {
    console.error(`Error removing tags from firewall ${firewallId}:`, error);
    throw new Error(`Failed to remove tags from firewall: ${error.message}`);
  }
}

// Thêm rules vào firewall
export async function addRulesToFirewall(
  firewallId: string, 
  inboundRules?: InboundRule[],
  outboundRules?: OutboundRule[]
): Promise<void> {
  try {
    const payload: any = {};
    if (inboundRules && inboundRules.length > 0) {
      payload.inbound_rules = inboundRules;
    }
    if (outboundRules && outboundRules.length > 0) {
      payload.outbound_rules = outboundRules;
    }
    
    await callDigitalOceanAPI(
      `/firewalls/${firewallId}/rules`,
      'POST',
      payload
    );
  } catch (error: any) {
    console.error(`Error adding rules to firewall ${firewallId}:`, error);
    throw new Error(`Failed to add rules to firewall: ${error.message}`);
  }
}

// Xóa rules khỏi firewall
export async function removeRulesFromFirewall(
  firewallId: string,
  inboundRules?: InboundRule[],
  outboundRules?: OutboundRule[]
): Promise<void> {
  try {
    const payload: any = {};
    if (inboundRules && inboundRules.length > 0) {
      payload.inbound_rules = inboundRules;
    }
    if (outboundRules && outboundRules.length > 0) {
      payload.outbound_rules = outboundRules;
    }
    
    await callDigitalOceanAPI(
      `/firewalls/${firewallId}/rules`,
      'DELETE',
      payload
    );
  } catch (error: any) {
    console.error(`Error removing rules from firewall ${firewallId}:`, error);
    throw new Error(`Failed to remove rules from firewall: ${error.message}`);
  }
}

