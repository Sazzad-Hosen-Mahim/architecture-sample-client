import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface StripeConsultationFormProps {
  onSuccess: (paymentIntentId: string) => void;
  clientEmail: string;
}

const StripeConsultationForm: React.FC<StripeConsultationFormProps> = ({
  onSuccess,
  clientEmail,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        payment_method_data: {
            billing_details: {
                email: clientEmail
            }
        }
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
      toast.error(error.message || 'Payment failed');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      toast.success('Consultation fee paid successfully!');
      onSuccess(paymentIntent.id);
      setIsProcessing(false);
    } else {
        setErrorMessage('Payment processing or failed.');
        setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-white rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Payment Details</h3>
        <PaymentElement />
        {errorMessage && (
          <div className="mt-2 text-sm text-red-600 font-medium">
            {errorMessage}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl transition-all shadow-lg hover:shadow-blue-200"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          'Pay $250 Consultation Fee'
        )}
      </Button>
      
      <p className="text-xs text-center text-slate-500 mt-2">
        Secure payment processed by Stripe. Your project request will be submitted after payment.
      </p>
    </form>
  );
};

export default StripeConsultationForm;
