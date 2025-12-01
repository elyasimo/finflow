// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Loader2, User, Lock, Bell, Moon, Sun, LogOut } from 'lucide-react';
import Layout from '@/components/finflow/layout';
import MobileSettingsPage from '@/components/finflow/mobile-settings-page';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useMediaQuery } from '@/hooks/use-mobile';

export default function SettingsPage() {
  const { isAuthenticated, user, isLoading: authLoading, updateProfile, isUpdateProfileLoading, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('EUR');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // API Keys state
  const [alpacaApiKey, setAlpacaApiKey] = useState('');
  const [alpacaApiSecret, setAlpacaApiSecret] = useState('');
  const [alpacaIsPaper, setAlpacaIsPaper] = useState(true);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);

  // Binance API Keys state
  const [binanceApiKey, setBinanceApiKey] = useState('');
  const [binanceApiSecret, setBinanceApiSecret] = useState('');
  const [binanceKeysConfigured, setBinanceKeysConfigured] = useState(false);
  const [binanceApiKeysLoading, setBinanceApiKeysLoading] = useState(false);
  const [binanceStatusLoaded, setBinanceStatusLoaded] = useState(false);

  // Encryption status
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [encryptionError, setEncryptionError] = useState('');

  // Notification settings - stored locally until backend supports it
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmailNotif = localStorage.getItem('emailNotifications');
      const savedPushNotif = localStorage.getItem('pushNotifications');
      const savedBiometrics = localStorage.getItem('biometricsEnabled');
      
      if (savedEmailNotif !== null) setEmailNotifications(savedEmailNotif === 'true');
      if (savedPushNotif !== null) setPushNotifications(savedPushNotif === 'true');
      if (savedBiometrics !== null) setBiometricsEnabled(savedBiometrics === 'true');
    }
  }, []);

  // Check encryption status on mount
  useEffect(() => {
    const checkEncryptionStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api-keys/encryption-status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setEncryptionEnabled(data.enabled);
          if (!data.enabled) {
            setEncryptionError(data.reason || 'Encryption is disabled');
          }
        }
      } catch (error) {
        console.error('Failed to check encryption status:', error);
      }
    };
    
    if (typeof window !== 'undefined' && localStorage.getItem('accessToken')) {
      checkEncryptionStatus();
    }
  }, []);

  // Available currencies
  const currencies = [
    { value: 'EUR', label: '€ Euro (EUR)', symbol: '€' },
    { value: 'CHF', label: 'CHF Swiss Franc (CHF)', symbol: 'CHF' },
    { value: 'USD', label: '$ US Dollar (USD)', symbol: '$' },
    { value: 'MAD', label: 'MAD Moroccan Dirham (MAD)', symbol: 'MAD' },
  ];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Set form values when user data is loaded
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setDefaultCurrency(user.defaultCurrency || 'EUR');
      loadApiKeys();
      loadBinanceApiKeysStatus();
    }
  }, [user]);

  // Load API keys
  const loadApiKeys = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api-keys/alpaca`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.keys) {
          setAlpacaApiKey(data.keys.api_key || '');
          setAlpacaApiSecret(data.keys.api_secret || '');
          setAlpacaIsPaper(data.keys.is_paper === 'true');
        }
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  // Load Binance API keys status
  const loadBinanceApiKeysStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api-keys/binance/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBinanceKeysConfigured(data.configured || false);
      }
    } catch (error) {
      console.error('Failed to check Binance API keys status:', error);
    } finally {
      setBinanceStatusLoaded(true);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      await updateProfile({
        fullName,
        email,
      });
      toast.success(t('profileUpdatedSuccessfully') || 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(t('failedToUpdateProfile') || 'Failed to update profile');
    }
  };

  // Handle currency update
  const handleCurrencyUpdate = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/auth/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ defaultCurrency }),
      });
      
      if (response.ok) {
        toast.success(t('currencyUpdatedSuccessfully') || 'Currency updated successfully!');
        // Refresh user data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const error = await response.json();
        toast.error(error.message || t('failedToUpdateCurrency') || 'Failed to update currency');
      }
    } catch (error) {
      console.error('Currency update error:', error);
      toast.error(t('failedToUpdateCurrency') || 'Failed to update currency');
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t('passwordTooShort') || 'Password must be at least 8 characters long');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        toast.success(t('passwordUpdatedSuccessfully') || 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        toast.error(error.message || t('failedToUpdatePassword') || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password update error:', error);
      toast.error(t('failedToUpdatePassword') || 'Failed to update password');
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  // Handle API keys save
  const handleSaveApiKeys = async () => {
    if (!alpacaApiKey || !alpacaApiSecret) {
      toast.error('Please enter both API Key and API Secret');
      return;
    }

    setApiKeysLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api-keys/alpaca`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          apiKey: alpacaApiKey,
          apiSecret: alpacaApiSecret,
          permissions: { paper: alpacaIsPaper },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save API keys');
      }

      toast.success(t('apiKeysSavedSuccessfully') || 'API keys saved successfully!');
    } catch (error) {
      console.error('Failed to save API keys:', error);
      toast.error(t('failedToSaveApiKeys') || 'Failed to save API keys');
    } finally {
      setApiKeysLoading(false);
    }
  };

  // Handle Binance API keys save
  const handleSaveBinanceApiKeys = async () => {
    if (!binanceApiKey || !binanceApiSecret) {
      toast.error('Please enter both API Key and API Secret');
      return;
    }

    setBinanceApiKeysLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api-keys/binance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          apiKey: binanceApiKey,
          apiSecret: binanceApiSecret,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save Binance API keys');
      }

      toast.success('Binance API keys saved successfully!');
      setBinanceKeysConfigured(true);
      // Clear the fields after saving for security
      setBinanceApiKey('');
      setBinanceApiSecret('');
    } catch (error) {
      console.error('Failed to save Binance API keys:', error);
      toast.error('Failed to save Binance API keys');
    } finally {
      setBinanceApiKeysLoading(false);
    }
  };

  // Handle Binance API keys delete
  const handleDeleteBinanceApiKeys = async () => {
    setBinanceApiKeysLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api-keys/binance`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete Binance API keys');
      }

      toast.success('Binance API keys deleted successfully!');
      setBinanceKeysConfigured(false);
    } catch (error) {
      console.error('Failed to delete Binance API keys:', error);
      toast.error('Failed to delete Binance API keys');
    } finally {
      setBinanceApiKeysLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return <div className="flex h-screen items-center justify-center">{t('loading')}</div>;
  }

  // If not authenticated, don't render anything (will be redirected)
  if (!isAuthenticated) {
    return null;
  }

  // Handle password change for mobile
  const handlePasswordChange = async (currentPwd: string, newPwd: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        currentPassword: currentPwd,
        newPassword: newPwd,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Passwort konnte nicht geändert werden');
    }
    
    toast.success(t('passwordUpdatedSuccessfully') || 'Passwort erfolgreich geändert!');
  };

  // Render mobile version
  if (isMobile) {
    // Show loading while Binance status is being fetched
    if (!binanceStatusLoaded) {
      return (
        <div className="min-h-screen bg-[#f8f9fc] dark:bg-[#0f1419] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      );
    }
    
    // Compute apiKeys object for mobile
    const mobileApiKeys = {
      binanceApiKey: binanceKeysConfigured ? '••••••••••••••••' : '',
      binanceSecretKey: binanceKeysConfigured ? '••••••••••••••••' : '',
      alpacaApiKey: alpacaApiKey || '',
      alpacaSecretKey: alpacaApiSecret || '',
    };

    return (
      <MobileSettingsPage
        user={{
          id: user?.id || '',
          fullName: user?.fullName || '',
          email: user?.email || '',
        }}
        theme={theme || 'system'}
        language={language}
        currency={defaultCurrency}
        emailNotifications={emailNotifications}
        pushNotifications={pushNotifications}
        biometricsEnabled={biometricsEnabled}
        apiKeys={mobileApiKeys}
        onThemeChange={setTheme}
        onLanguageChange={setLanguage}
        onCurrencyChange={async (currency) => {
          setDefaultCurrency(currency);
          // Persist to API
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/auth/preferences`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              },
              body: JSON.stringify({ defaultCurrency: currency }),
            });
            
            if (response.ok) {
              toast.success('Währung aktualisiert');
            }
          } catch (error) {
            console.error('Currency update error:', error);
          }
        }}
        onEmailNotificationsChange={async (enabled) => {
          setEmailNotifications(enabled);
          localStorage.setItem('emailNotifications', String(enabled));
          toast.success(enabled ? 'E-Mail Benachrichtigungen aktiviert' : 'E-Mail Benachrichtigungen deaktiviert');
        }}
        onPushNotificationsChange={async (enabled) => {
          setPushNotifications(enabled);
          localStorage.setItem('pushNotifications', String(enabled));
          toast.success(enabled ? 'Push-Benachrichtigungen aktiviert' : 'Push-Benachrichtigungen deaktiviert');
        }}
        onBiometricsChange={async (enabled) => {
          setBiometricsEnabled(enabled);
          localStorage.setItem('biometricsEnabled', String(enabled));
          toast.success(enabled ? 'Face ID / Touch ID aktiviert' : 'Face ID / Touch ID deaktiviert');
        }}
        onUpdateProfile={async (data) => {
          if (data.fullName) setFullName(data.fullName);
          if (data.email) setEmail(data.email);
          await handleProfileUpdate();
        }}
        onChangePassword={handlePasswordChange}
        onSaveApiKeys={async (keys) => {
          // Save Binance keys if provided
          if (keys.binanceApiKey && keys.binanceSecretKey && 
              !keys.binanceApiKey.includes('•') && !keys.binanceSecretKey.includes('•')) {
            setBinanceApiKeysLoading(true);
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api-keys/binance`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                  apiKey: keys.binanceApiKey,
                  apiSecret: keys.binanceSecretKey,
                }),
              });
              
              if (!response.ok) {
                throw new Error('Failed to save Binance API keys');
              }
              
              setBinanceKeysConfigured(true);
              toast.success('Binance API-Schlüssel gespeichert!');
            } catch (error) {
              console.error('Failed to save Binance API keys:', error);
              throw new Error('Binance API-Schlüssel konnten nicht gespeichert werden');
            } finally {
              setBinanceApiKeysLoading(false);
            }
          }
          
          // Save Alpaca keys if provided
          if (keys.alpacaApiKey && keys.alpacaSecretKey) {
            setApiKeysLoading(true);
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api-keys/alpaca`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                  apiKey: keys.alpacaApiKey,
                  apiSecret: keys.alpacaSecretKey,
                  permissions: { paper: true },
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save Alpaca API keys');
              }
              
              setAlpacaApiKey(keys.alpacaApiKey);
              setAlpacaApiSecret(keys.alpacaSecretKey);
              toast.success('Alpaca API-Schlüssel gespeichert!');
            } catch (error) {
              console.error('Failed to save Alpaca API keys:', error);
              throw new Error('Alpaca API-Schlüssel konnten nicht gespeichert werden');
            } finally {
              setApiKeysLoading(false);
            }
          }
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <Layout user={user}>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">{t('settings')}</h1>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
            <TabsTrigger value="security">{t('security')}</TabsTrigger>
            <TabsTrigger value="apikeys">API Keys</TabsTrigger>
            <TabsTrigger value="notifications">{t('notifications')}</TabsTrigger>
            <TabsTrigger value="appearance">{t('appearance')}</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('profileInformation')}</CardTitle>
                <CardDescription>
                  {t('updateAccountProfile')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('fullName')}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleProfileUpdate} disabled={isUpdateProfileLoading}>
                  {isUpdateProfileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('saveChanges')}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('defaultCurrency')}</CardTitle>
                <CardDescription>
                  {t('setPreferredCurrency')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('currency')}</Label>
                  <select
                    id="currency"
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                  >
                    {currencies.map((curr) => (
                      <option key={curr.value} value={curr.value}>
                        {curr.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground">
                    {t('thisWillBeUsedAsDefault')}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCurrencyUpdate}>
                  {t('saveCurrencyPreference')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('changePassword')}</CardTitle>
                <CardDescription>
                  {t('updatePassword')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('newPassword')}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-red-500">{passwordError}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handlePasswordUpdate}>
                  {t('updatePassword')}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('logout')}</CardTitle>
                <CardDescription>
                  {t('logoutOfAccount')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('thisWillLogYouOut')}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('logout')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* API Keys Tab */}
          <TabsContent value="apikeys" className="space-y-4">
            {/* Encryption Warning Banner */}
            {!encryptionEnabled && (
              <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <span className="text-xl">⚠️</span>
                    API Key Encryption Disabled
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    {encryptionError}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <strong>Action Required:</strong> Set the <code className="bg-red-100 dark:bg-red-800 px-1 rounded">ENCRYPTION_MASTER_KEY</code> environment variable on the server and restart it to enable secure API key storage.
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    Generate a key with: <code className="bg-red-100 dark:bg-red-800 px-1 rounded">node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"</code>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Binance API Keys Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">₿</span>
                  Binance API Keys
                </CardTitle>
                <CardDescription>
                  Configure your Binance API keys to view your crypto portfolio. Get your keys from{' '}
                  <a 
                    href="https://www.binance.com/en/my/settings/api-management" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Binance API Management
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {binanceKeysConfigured ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                    <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <strong>Binance API Keys are configured.</strong> Your portfolio data is being fetched securely.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="binanceApiKey">API Key</Label>
                      <Input
                        id="binanceApiKey"
                        type="password"
                        value={binanceApiKey}
                        onChange={(e) => setBinanceApiKey(e.target.value)}
                        placeholder="Enter your Binance API Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="binanceApiSecret">API Secret</Label>
                      <Input
                        id="binanceApiSecret"
                        type="password"
                        value={binanceApiSecret}
                        onChange={(e) => setBinanceApiSecret(e.target.value)}
                        placeholder="Enter your Binance API Secret"
                      />
                    </div>
                  </>
                )}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Security Tips:</strong>
                  </p>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 list-disc list-inside mt-2 space-y-1">
                    <li>Only enable "Enable Reading" permission</li>
                    <li>Do NOT enable trading or withdrawal permissions</li>
                    <li>Enable IP Whitelist for extra security</li>
                    <li>Your keys are stored encrypted in our database</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                {binanceKeysConfigured ? (
                  <Button variant="destructive" onClick={handleDeleteBinanceApiKeys} disabled={binanceApiKeysLoading}>
                    {binanceApiKeysLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Remove API Keys
                  </Button>
                ) : (
                  <Button onClick={handleSaveBinanceApiKeys} disabled={binanceApiKeysLoading}>
                    {binanceApiKeysLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Binance API Keys
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Alpaca API Keys Card */}
            <Card>
              <CardHeader>
                <CardTitle>Alpaca API Keys</CardTitle>
                <CardDescription>
                  Configure your Alpaca API keys for stock trading. Get your keys from{' '}
                  <a 
                    href="https://alpaca.markets/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    alpaca.markets
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alpacaApiKey">API Key</Label>
                  <Input
                    id="alpacaApiKey"
                    type="password"
                    value={alpacaApiKey}
                    onChange={(e) => setAlpacaApiKey(e.target.value)}
                    placeholder="Enter your Alpaca API Key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alpacaApiSecret">API Secret</Label>
                  <Input
                    id="alpacaApiSecret"
                    type="password"
                    value={alpacaApiSecret}
                    onChange={(e) => setAlpacaApiSecret(e.target.value)}
                    placeholder="Enter your Alpaca API Secret"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="alpacaIsPaper"
                    checked={alpacaIsPaper}
                    onCheckedChange={setAlpacaIsPaper}
                  />
                  <Label htmlFor="alpacaIsPaper">Use Paper Trading (Recommended for testing)</Label>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> Your API keys are stored securely and encrypted in the database.
                    Paper trading allows you to test strategies without real money.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveApiKeys} disabled={apiKeysLoading}>
                  {apiKeysLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save API Keys
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('notificationSettings')}</CardTitle>
                <CardDescription>
                  {t('configureHowYouReceive')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emailNotifications">{t('emailNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('receiveNotificationsViaEmail')}
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="pushNotifications">{t('pushNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('receiveNotificationsOnDevice')}
                    </p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  {t('savePreferences')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('theme')}</CardTitle>
                <CardDescription>
                  {t('customizeAppearance')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="flex flex-col items-center justify-center gap-2 p-4 h-auto"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="h-6 w-6" />
                    <span>{t('light')}</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="flex flex-col items-center justify-center gap-2 p-4 h-auto"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="h-6 w-6" />
                    <span>{t('dark')}</span>
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="flex flex-col items-center justify-center gap-2 p-4 h-auto"
                    onClick={() => setTheme('system')}
                  >
                    <span className="flex">
                      <Sun className="h-6 w-6" />
                      <Moon className="h-6 w-6" />
                    </span>
                    <span>{t('system')}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
