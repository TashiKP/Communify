import { AppRegistry } from 'react-native';
import App from './app/App';
import { name as appName } from './app.json';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';

function Main() {
  return (
    <NavigationContainer>
      <App />
    </NavigationContainer>
  );
}

AppRegistry.registerComponent(appName, () => Main);
