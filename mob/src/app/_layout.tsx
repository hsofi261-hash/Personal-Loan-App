import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Provider } from 'react-redux';
import StoreProvider from './StoreProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const queryClient = new QueryClient();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StoreProvider>
        <QueryClientProvider client={queryClient}>
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            headerShown: false, // Hides native stack headers so your custom navbar displays cleanly
          }}
        />
        </QueryClientProvider>
      </StoreProvider>
    </ThemeProvider>
  );
}
