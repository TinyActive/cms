import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"

interface PayPalButtonProps {
  amount: number;
  onSuccess: (details: any) => void;
}

const PayPalButton = ({ amount, onSuccess }: PayPalButtonProps) => {
  return (
    <PayPalScriptProvider options={{ "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID }}>
      <PayPalButtons
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount.toString(),
                },
              },
            ],
          })
        }}
        onApprove={(data, actions) => {
          return actions.order.capture().then((details) => {
            onSuccess(details)
          })
        }}
      />
    </PayPalScriptProvider>
  )
}

export default PayPalButton 