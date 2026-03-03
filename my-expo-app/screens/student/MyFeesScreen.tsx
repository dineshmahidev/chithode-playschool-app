import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

interface NavigationProps {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface MyFeesScreenProps {
  navigation: NavigationProps;
}

export default function MyFeesScreen({ navigation }: MyFeesScreenProps) {
  const { colors, theme } = useTheme();
  const { user, fees: allFees, feeStructures } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const myFees = useMemo(() => {
    if (!user) return [];
    const studentUid = user.studentId || (user.id ? user.id.toString() : '');
    return allFees.filter(f => f.student_id === studentUid);
  }, [allFees, user]);

  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  const overdueMonthInfo = useMemo(() => {
    if (!user || user.role !== 'student') return null;
    
    const studentUid = user.studentId || (user.id ? user.id.toString() : '');
    const currentMonthFee = allFees.find(f => 
      f.student_id === studentUid && 
      f.date === currentMonthStr &&
      f.type === 'Monthly Fee'
    );

    const isPaid = currentMonthFee?.status === 'paid';
    const dueDay = parseInt(user.fee_due_day || '5');
    const today = new Date().getDate();
    const isOverdue = !isPaid && today > dueDay;

    return {
      fee: currentMonthFee,
      isPaid,
      isOverdue,
      amount: parseInt(user.fees || '0'),
      dueDay
    };
  }, [allFees, user, currentMonthStr]);

  const feeDetails = useMemo(() => {
    return feeStructures.map(fs => {
      const paidForCategory = myFees
        .filter(f => f.type === fs.name && f.status === 'paid')
        .reduce((sum, f) => sum + f.amount, 0);
      
      return {
        id: fs.id,
        title: fs.name,
        amount: fs.amount,
        paid: paidForCategory,
        status: paidForCategory >= fs.amount ? 'paid' : 'pending'
      };
    });
  }, [feeStructures, myFees]);

  const paymentHistory = useMemo(() => {
    return myFees.map(f => ({
      id: f.id,
      month: f.date,
      amount: f.amount,
      date: f.date,
      invoiceNo: `INV-2026-${f.id.toString().padStart(3, '0')}`,
      status: f.status,
      paymentType: 'Online',
      transactionId: `TXN${f.id}${Date.now().toString().slice(-6)}`,
      feeCategories: [`${f.type}: ₹${f.amount.toLocaleString()}`]
    }));
  }, [myFees]);

  const totalAmount = feeDetails.reduce((sum, fee) => sum + fee.amount, 0);
  const totalPaid = feeDetails.reduce((sum, fee) => sum + fee.paid, 0);
  const totalPending = totalAmount - totalPaid;

  const handleViewInvoice = (payment: any) => {
    setSelectedInvoice(payment);
    setShowInvoiceModal(true);
  };

  const generateInvoiceHTML = (payment: any) => {
    const feeRows = payment.feeCategories.map((category: string) => 
      `<tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">
          <span style="color: #10B981; margin-right: 6px;">✓</span>${category}
        </td>
      </tr>`
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${payment.invoiceNo}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              font-size: 11px;
            }
            .header {
              background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%);
              color: white;
              padding: 15px 20px;
              border-radius: 12px;
              margin-bottom: 15px;
            }
            .school-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 3px;
            }
            .school-info {
              font-size: 9px;
              opacity: 0.9;
              margin-top: 5px;
            }
            .row {
              display: flex;
              gap: 10px;
              margin-bottom: 10px;
            }
            .col {
              flex: 1;
            }
            .section {
              background: #f9fafb;
              padding: 10px 12px;
              border-radius: 8px;
              margin-bottom: 10px;
            }
            .section-title {
              font-size: 9px;
              text-transform: uppercase;
              color: #6b7280;
              font-weight: bold;
              margin-bottom: 6px;
              letter-spacing: 0.5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              padding: 3px 0;
              font-size: 10px;
            }
            .label {
              color: #6b7280;
              font-weight: 600;
              font-size: 10px;
            }
            .value {
              font-weight: bold;
              color: #111827;
              font-size: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            .total-box {
              background: #d1fae5;
              border: 2px solid #10B981;
              padding: 12px 15px;
              border-radius: 8px;
              margin: 10px 0;
            }
            .total-amount {
              font-size: 24px;
              font-weight: bold;
              color: #059669;
              text-align: right;
            }
            .status-box {
              background: #fce7f3;
              border: 2px solid #EC4899;
              padding: 8px;
              border-radius: 8px;
              text-align: center;
              margin: 10px 0;
            }
            .status-text {
              font-size: 13px;
              font-weight: bold;
              color: #EC4899;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 8px;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">🏫 Chithode HappyKids</div>
            <div style="font-size: 11px; margin-top: 3px;">Fee Invoice</div>
            <div class="school-info">
              Chithode, Coimbatore | Phone: +91 98765 43210
            </div>
          </div>

          <div class="row">
            <div class="col">
              <div class="section">
                <div class="info-row">
                  <span class="label">Invoice No:</span>
                  <span class="value">${payment.invoiceNo}</span>
                </div>
                <div class="info-row">
                  <span class="label">Date:</span>
                  <span class="value">${payment.date}</span>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="section">
                <div class="info-row">
                  <span class="label">Payment Type:</span>
                  <span class="value">${payment.paymentType || 'N/A'}</span>
                </div>
                ${payment.paymentType !== 'Cash' && payment.transactionId ? `
                <div class="info-row">
                  <span class="label">Transaction ID:</span>
                  <span class="value" style="font-size: 9px;">${payment.transactionId}</span>
                </div>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="info-row">
              <span class="label">Payment Period:</span>
              <span class="value">${payment.month}</span>
            </div>
          </div>

          <div class="row">
            <div class="col">
              <div class="section">
                <div class="section-title">Student Details</div>
                <div class="info-row">
                  <span class="label">Name:</span>
                  <span class="value">${user?.name || 'Student Name'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Student ID:</span>
                  <span class="value">${user?.studentId || 'STU001'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Class:</span>
                  <span class="value">${user?.category || 'Kindergarten'}</span>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="section">
                <div class="section-title">Payer Information</div>
                <div class="info-row">
                  <span class="label">Name:</span>
                  <span class="value">${user?.parentName || 'Parent Name'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Phone:</span>
                  <span class="value">+91 98765 43210</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Fee Breakdown</div>
            <table>
              ${feeRows}
            </table>
          </div>

          <div class="total-box">
            <div class="info-row" style="margin-bottom: 0;">
              <span style="font-size: 14px; font-weight: bold; color: #059669;">Total Amount Paid</span>
              <span class="total-amount">₹${payment.amount.toLocaleString()}</span>
            </div>
          </div>

          <div class="status-box">
            <div class="status-text">✓ PAYMENT RECEIVED</div>
          </div>

          <div class="footer">
            <p style="margin: 3px 0;"><strong>Thank you for your payment!</strong></p>
            <p style="margin: 3px 0;">This is a computer-generated invoice and does not require a signature.</p>
            <p style="margin: 3px 0;">Generated on ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadInvoice = async (payment: any) => {
    try {
      const html = generateInvoiceHTML(payment);
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      Alert.alert('Success', 'Invoice downloaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to download invoice. Please try again.');
      console.error(error);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${colors.background}`}>
      {/* Consistent Header */}
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              className={`mb-4 ${colors.surface} w-12 h-12 rounded-2xl items-center justify-center border ${colors.border}`}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme === 'dark' ? '#FFF' : '#000'} />
            </TouchableOpacity>
            <Text className={`text-4xl font-black ${colors.text} tracking-tighter`}>My</Text>
            <Text className="text-2xl font-bold text-brand-pink">Fees 💰</Text>
          </View>
          <View className="bg-green-500 w-16 h-16 rounded-3xl items-center justify-center shadow-lg border-4 border-green-200">
            <MaterialCommunityIcons name="currency-inr" size={32} color="white" />
          </View>
        </View>
      </View>

      {/* Tab Buttons */}
      <View className="px-6 mb-4">
        <View className={`${colors.surface} rounded-2xl p-1 flex-row border ${colors.border}`}>
          <TouchableOpacity
            onPress={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 rounded-xl ${activeTab === 'dashboard' ? 'bg-brand-pink' : ''}`}
            activeOpacity={0.7}
          >
            <Text className={`text-center font-black ${activeTab === 'dashboard' ? 'text-white' : colors.text}`}>
              Dashboard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            className={`flex-1 py-3 rounded-xl ${activeTab === 'history' ? 'bg-brand-pink' : ''}`}
            activeOpacity={0.7}
          >
            <Text className={`text-center font-black ${activeTab === 'history' ? 'text-white' : colors.text}`}>
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {activeTab === 'dashboard' ? (
          <>
            {/* Fee Summary */}
            <View className={`${colors.surface} rounded-[28px] p-6 mb-6 border-2 ${overdueMonthInfo?.isOverdue ? 'border-red-500' : colors.border} relative overflow-hidden`}>
              {overdueMonthInfo?.isOverdue && (
                <View className="bg-red-500 absolute top-0 right-0 left-0 py-2 items-center">
                  <Text className="text-white text-[10px] font-black uppercase tracking-[3px]">Overdue Notice ⚡</Text>
                </View>
              )}
              
              <View className={overdueMonthInfo?.isOverdue ? 'mt-8' : ''}>
                <Text className={`text-lg font-black ${colors.text} mb-4`}>Fee Summary</Text>
                
                <View className="flex-row justify-between mb-3">
                  <Text className={`${colors.textSecondary} font-bold`}>Total Amount</Text>
                  <Text className={`${colors.text} font-black text-lg`}>₹{totalAmount.toLocaleString()}</Text>
                </View>
                
                <View className="flex-row justify-between mb-3">
                  <Text className={`${colors.textSecondary} font-bold`}>Paid</Text>
                  <Text className="text-green-600 font-black text-lg">₹{totalPaid.toLocaleString()}</Text>
                </View>
                
                <View className={`border-t ${colors.border} pt-3 mt-2`}>
                  <View className="flex-row justify-between">
                    <Text className={`${colors.text} font-black text-lg`}>Pending Balance</Text>
                    <Text className={`${(totalPending > 0 || overdueMonthInfo?.isOverdue) ? 'text-red-600' : 'text-green-600'} font-black text-xl`}>
                      ₹{(totalPending + (overdueMonthInfo?.isOverdue ? overdueMonthInfo.amount : 0)).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Fee Details */}
            <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
              Fee Breakdown
            </Text>

            {feeDetails.length > 0 ? (
              feeDetails.map((fee) => (
                <View 
                  key={fee.id} 
                  className={`${colors.surface} rounded-2xl p-5 mb-4 border ${colors.border}`}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className={`font-black ${colors.text} text-base mb-1`}>{fee.title}</Text>
                      <Text className={`text-sm ${colors.textSecondary}`}>
                        Paid: ₹{fee.paid.toLocaleString()} / ₹{fee.amount.toLocaleString()}
                      </Text>
                    </View>
                    <View className={`${fee.status === 'paid' ? 'bg-green-500' : (overdueMonthInfo?.isOverdue ? 'bg-red-500' : 'bg-orange-500')} px-3 py-1 rounded-full`}>
                      <Text className="text-white text-xs font-black uppercase">{fee.status === 'pending' && overdueMonthInfo?.isOverdue ? 'OVERDUE' : fee.status}</Text>
                    </View>
                  </View>
                  
                  {/* Progress Bar */}
                  <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} h-2 rounded-full overflow-hidden`}>
                    <View 
                      className="bg-green-500 h-full rounded-full" 
                      style={{ width: `${(fee.paid / fee.amount) * 100}%` }}
                    />
                  </View>
                </View>
              ))
            ) : (
              <View className={`${colors.surface} rounded-3xl p-10 items-center justify-center border border-dashed ${colors.border}`}>
                <MaterialCommunityIcons name="currency-inr-off" size={48} color={colors.textTertiary} />
                <Text className={`mt-4 font-bold ${colors.textSecondary} text-center`}>No fee structures defined yet</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Payment History */}
            <Text className={`text-xl font-black ${colors.text} mb-4 ml-1 uppercase tracking-widest opacity-60`}>
              Payment History
            </Text>

            {paymentHistory.length > 0 ? (
              paymentHistory.map((payment) => (
                <View 
                  key={payment.id} 
                  className={`${colors.surface} rounded-2xl p-5 mb-4 border ${colors.border}`}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className={`font-black ${colors.text} text-lg mb-1`}>{payment.month}</Text>
                      <Text className={`text-sm ${colors.textSecondary}`}>{payment.date}</Text>
                    </View>
                    <View className={`${payment.status === 'paid' ? 'bg-green-500' : 'bg-orange-500'} px-3 py-1 rounded-full`}>
                      <Text className="text-white text-xs font-black uppercase">{payment.status}</Text>
                    </View>
                  </View>

                  {payment.status === 'paid' ? (
                    <>
                      <View className="flex-row items-center mb-3">
                        <MaterialCommunityIcons name="receipt" size={16} color="#10B981" />
                        <Text className={`text-sm ${colors.textSecondary} ml-2`}>Invoice: {payment.invoiceNo}</Text>
                      </View>

                      <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-3 mb-3`}>
                        <View className="flex-row justify-between items-center">
                          <Text className={`${colors.textSecondary} text-sm font-bold`}>Amount Paid</Text>
                          <Text className="text-green-600 font-black text-2xl">₹{payment.amount.toLocaleString()}</Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row justify-between">
                        <TouchableOpacity
                          onPress={() => handleViewInvoice(payment)}
                          className="flex-1 mr-2 bg-blue-500 py-3 rounded-xl flex-row items-center justify-center"
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="eye" size={18} color="white" />
                          <Text className="text-white font-black ml-2">View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDownloadInvoice(payment)}
                          className="flex-1 ml-2 bg-green-500 py-3 rounded-xl flex-row items-center justify-center"
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="download" size={18} color="white" />
                          <Text className="text-white font-black ml-2">Download</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4`}>
                      <Text className={`${colors.textSecondary} text-center`}>No payment made for this month</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View className={`${colors.surface} rounded-3xl p-10 items-center justify-center border border-dashed ${colors.border}`}>
                <MaterialCommunityIcons name="history" size={48} color={colors.textTertiary} />
                <Text className={`mt-4 font-bold ${colors.textSecondary} text-center`}>No payment history found</Text>
              </View>
            )}
          </>
        )}

        <View className="h-20" />
      </ScrollView>

      {/* Invoice Modal */}
      <Modal
        visible={showInvoiceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-center items-center px-4">
          <View className={`${colors.surface} rounded-[32px] w-full max-w-md border-4 border-brand-pink shadow-2xl`}>
            {/* School Header */}
            <View className="bg-brand-pink rounded-t-[28px] p-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <View className="bg-white w-12 h-12 rounded-full items-center justify-center mr-3">
                      <MaterialCommunityIcons name="school" size={24} color="#EC4899" />
                    </View>
                    <View>
                      <Text className="text-white text-xl font-black">Chithode HappyKids</Text>
                      <Text className="text-white/80 text-xs font-bold">Fee Invoice</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowInvoiceModal(false)}
                  className="bg-white/20 w-10 h-10 rounded-full items-center justify-center"
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              <View className="bg-white/20 rounded-xl p-3">
                <Text className="text-white/90 text-xs">Chithode, Coimbatore</Text>
                <Text className="text-white/90 text-xs">Phone: +91 98765 43210</Text>
              </View>
            </View>

            <ScrollView className="max-h-96 p-6" showsVerticalScrollIndicator={false}>
              {/* Invoice Number & Date */}
              <View className="mb-4">
                <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4`}>
                  <View className="flex-row justify-between mb-2">
                    <Text className={`${colors.textSecondary} text-sm font-bold`}>Invoice No:</Text>
                    <Text className={`${colors.text} font-black`}>{selectedInvoice?.invoiceNo}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className={`${colors.textSecondary} text-sm font-bold`}>Date:</Text>
                    <Text className={`${colors.text} font-black`}>{selectedInvoice?.date}</Text>
                  </View>
                </View>
              </View>

              {/* Payment Type & Transaction ID */}
              <View className="mb-4">
                <Text className={`text-sm ${colors.textSecondary} uppercase font-bold tracking-wider mb-2`}>
                  Payment Information
                </Text>
                <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4`}>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className={`${colors.textSecondary} text-sm font-bold`}>Payment Type:</Text>
                    <View className="bg-blue-500 px-3 py-1 rounded-full">
                      <Text className="text-white text-[10px] font-black">{selectedInvoice?.paymentType || 'N/A'}</Text>
                    </View>
                  </View>
                  {selectedInvoice?.paymentType !== 'Cash' && selectedInvoice?.transactionId && (
                    <View className="flex-row justify-between items-center">
                      <Text className={`${colors.textSecondary} text-sm font-bold`}>Transaction ID:</Text>
                      <Text className={`${colors.text} font-bold text-[10px]`}>{selectedInvoice?.transactionId}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Student Info with Picture */}
              <View className="mb-4">
                <Text className={`text-sm ${colors.textSecondary} uppercase font-bold tracking-wider mb-2`}>
                  Student Details
                </Text>
                <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4`}>
                  <View className="flex-row items-center mb-3">
                    <View className="bg-brand-yellow w-16 h-16 rounded-full items-center justify-center mr-4 border-4 border-yellow-200">
                      <MaterialCommunityIcons name="account" size={32} color="#92400E" />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-black ${colors.text} text-lg`}>{user?.name || 'Student Name'}</Text>
                      <Text className={`text-sm ${colors.textSecondary}`}>ID: {user?.studentId || 'STU001'}</Text>
                      <Text className={`text-xs ${colors.textTertiary} mt-1`}>Class: {user?.category || 'Kindergarten'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Payer Information */}
              <View className="mb-4">
                <Text className={`text-sm ${colors.textSecondary} uppercase font-bold tracking-wider mb-2`}>
                  Payer Information
                </Text>
                <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4`}>
                  <View className="flex-row items-center mb-2">
                    <MaterialCommunityIcons name="account-tie" size={18} color="#3B82F6" />
                    <Text className={`${colors.text} font-bold ml-2`}>{user?.parentName || 'Parent Name'}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="phone" size={18} color="#10B981" />
                    <Text className={`${colors.textSecondary} ml-2`}>+91 98765 43210</Text>
                  </View>
                </View>
              </View>

              {/* Payment Period */}
              <View className="mb-4">
                <Text className={`text-sm ${colors.textSecondary} uppercase font-bold tracking-wider mb-2`}>
                  Payment Period
                </Text>
                <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4`}>
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="calendar-month" size={18} color="#EC4899" />
                    <Text className={`${colors.text} font-bold ml-2`}>{selectedInvoice?.month}</Text>
                  </View>
                </View>
              </View>

              {/* Fee Categories */}
              <View className="mb-4">
                <Text className={`text-sm ${colors.textSecondary} uppercase font-bold tracking-wider mb-2`}>
                  Fee Breakdown
                </Text>
                {selectedInvoice?.feeCategories?.map((category: string, index: number) => (
                  <View 
                    key={index}
                    className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-3 mb-2 flex-row items-center justify-between`}
                  >
                    <View className="flex-row items-center flex-1">
                      <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                      <Text className={`${colors.text} ml-2 flex-1`}>{category}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Total Amount */}
              <View className="bg-green-500/10 rounded-2xl p-5 border-2 border-green-500 mb-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-green-700 font-bold text-lg">Total Amount Paid</Text>
                  <Text className="text-green-600 font-black text-3xl">₹{selectedInvoice?.amount.toLocaleString()}</Text>
                </View>
              </View>

              {/* Payment Status */}
              <View className="bg-brand-pink/10 rounded-2xl p-4 border-2 border-brand-pink mb-4">
                <View className="flex-row items-center justify-center">
                  <MaterialCommunityIcons name="check-decagram" size={24} color="#EC4899" />
                  <Text className="text-brand-pink font-black text-lg ml-2">PAYMENT RECEIVED</Text>
                </View>
              </View>

              {/* Footer */}
              <View className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-2xl p-4`}>
                <Text className={`${colors.textSecondary} text-xs text-center mb-2`}>
                  Thank you for your payment!
                </Text>
                <Text className={`${colors.textTertiary} text-xs text-center`}>
                  This is a computer-generated invoice and does not require a signature.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
