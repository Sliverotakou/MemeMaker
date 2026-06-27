import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MainTabScreen } from './src/screens/MainTabScreen';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FCF8F2" />
      <MainTabScreen />
    </SafeAreaProvider>
  );
}

export default App;
