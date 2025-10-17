import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { DollarSign, CreditCard, AlertCircle, CheckCircle, Repeat, Settings, FileText, Calendar } from 'lucide-react';
import SquarePayment from '../payments/SquarePayment';
import { filter as filterPayments } from '../../api/entities/Payment';

const FinancialDashboard = ({ player, onPaymentSuccess }) => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentPlan, setShowPaymentPlan] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState({
    totalAmount: 0,
    installments: 3,
    frequency: 'monthly'
  });
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [recurringPayments, setRecurringPayments] = useState([]);

  // Calculate financial status
  const totalFees = player?.fees || 0;
  const amountPaid = player?.feesPaid || 0;
  const amountOwed = Math.max(0, totalFees - amountPaid);
  const pastDue = player?.pastDue || 0;

  useEffect(() => {
    loadPaymentHistory();
  }, [player?.id]);

  const loadPaymentHistory = async () => {
    if (!player?.id) return;
    
    try {
      const payments = await filterPayments({ 
        playerId: player.id 
      });
      setPaymentHistory(payments || []);
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (payment) => {
    setShowPayment(false);
    onPaymentSuccess?.(payment);
    loadPaymentHistory(); // Refresh payment history
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error}`);
  };

  const getPaymentStatus = () => {
    if (amountOwed === 0) return { status: 'paid', color: 'green', icon: CheckCircle };
    if (pastDue > 0) return { status: 'overdue', color: 'red', icon: AlertCircle };
    if (amountPaid > 0) return { status: 'partial', color: 'yellow', icon: CreditCard };
    return { status: 'unpaid', color: 'gray', icon: DollarSign };
  };

  const paymentStatus = getPaymentStatus();
  const StatusIcon = paymentStatus.icon;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFees.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${amountPaid.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Owed</CardTitle>
            <StatusIcon className={`h-4 w-4 text-${paymentStatus.color}-600`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-${paymentStatus.color}-600`}>
              ${amountOwed.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Pay Status</CardTitle>
            <Repeat className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{autoPayEnabled ? 'Enabled' : 'Disabled'}</div>
            <Badge variant={autoPayEnabled ? 'default' : 'secondary'}>
              {autoPayEnabled ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Payment Plan Setup */}
      {showPaymentPlan && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Set Up Payment Plan
              <Button variant="ghost" size="sm" onClick={() => setShowPaymentPlan(false)}>
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Amount</label>
                <Input
                  type="number"
                  value={paymentPlan.totalAmount}
                  onChange={(e) => setPaymentPlan(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Installments</label>
                <select
                  value={paymentPlan.installments}
                  onChange={(e) => setPaymentPlan(prev => ({ ...prev, installments: parseInt(e.target.value) }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value={2}>2 payments</option>
                  <option value={3}>3 payments</option>
                  <option value={4}>4 payments</option>
                  <option value={6}>6 payments</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Frequency</label>
                <select
                  value={paymentPlan.frequency}
                  onChange={(e) => setPaymentPlan(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Payment Plan Summary</h4>
              <p className="text-sm text-muted-foreground">
                ${(paymentPlan.totalAmount / paymentPlan.installments).toFixed(2)} per {paymentPlan.frequency} payment
              </p>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowPaymentPlan(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                console.log('Setting up payment plan:', paymentPlan);
                setShowPaymentPlan(false);
              }}>
                Set Up Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => {
          setPaymentPlan(prev => ({ ...prev, totalAmount: amountOwed }));
          setShowPaymentPlan(true);
        }}>
          <Repeat className="h-4 w-4 mr-2" />
          Set Up Payment Plan
        </Button>
        <Button variant="outline" onClick={() => setAutoPayEnabled(!autoPayEnabled)}>
          <Settings className="h-4 w-4 mr-2" />
          {autoPayEnabled ? 'Disable' : 'Enable'} Auto-Pay
        </Button>
        <Button variant="outline" onClick={() => {
          // Generate financial report
          const reportData = {
            player: `${player?.firstName} ${player?.lastName}`,
            totalFees,
            amountPaid,
            amountOwed,
            pastDue,
            paymentHistory
          };
          console.log('Generating financial report:', reportData);
          alert('Financial report generated! Check console for details.');
        }}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Payment Status & Action */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 text-${paymentStatus.color}-600`} />
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant={paymentStatus.color === 'green' ? 'default' : 'destructive'}>
                {paymentStatus.status === 'paid' && 'Paid in Full'}
                {paymentStatus.status === 'partial' && 'Partial Payment'}
                {paymentStatus.status === 'overdue' && 'Overdue'}
                {paymentStatus.status === 'unpaid' && 'Unpaid'}
              </Badge>
              {pastDue > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  ${pastDue.toFixed(2)} past due - please pay immediately
                </p>
              )}
            </div>
            
            {amountOwed > 0 && (
              <Button 
                onClick={() => setShowPayment(true)}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay ${amountOwed.toFixed(2)}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recurring Payments */}
      {autoPayEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Recurring Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                <div>
                  <p className="font-medium">Monthly Team Fee</p>
                  <p className="text-sm text-muted-foreground">
                    Next payment: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">$150.00</p>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History & Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length === 0 ? (
            <p className="text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <>
              {/* Payment Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">{paymentHistory.length}</p>
                  <p className="text-sm text-muted-foreground">Total Payments</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">
                    ${(paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0)).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">
                    ${paymentHistory.length > 0 ? (paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0) / paymentHistory.length).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-sm text-muted-foreground">Average Payment</p>
                </div>
              </div>
              
              {/* Payment List */}
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">${payment.amount?.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                        {payment.isRecurring && (
                          <Badge variant="outline" className="ml-2">
                            <Repeat className="h-3 w-3 mr-1" />
                            Recurring
                          </Badge>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={payment.status === 'Completed' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                      {payment.transactionId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ID: {payment.transactionId.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Pay Team Fees</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPayment(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Player: {player?.firstName} {player?.lastName}
              </p>
              <p className="text-lg font-semibold">
                Amount Due: ${amountOwed.toFixed(2)}
              </p>
            </div>

            <SquarePayment
              amount={amountOwed}
              planName={`Team Fees - ${player?.firstName} ${player?.lastName}`}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;