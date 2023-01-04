import React, { useCallback } from 'react'
import { useConnectWallet } from "@web3-onboard/react";
import {
  Text,
  HStack,
  Heading,
  Switch,
  useColorMode,
  VStack,
  Box,
  Button,
} from "native-base";

function App() {
  const { colorMode } = useColorMode();
  const [{ wallet }, connect, disconnect] = useConnectWallet();

  const prevCon = false

  const connectFN = useCallback(() => {
    // casting as any will make autoSelect a required property (why?)
    // this is only used for an eager connecting an existing previous one
    // ie:
    if (prevCon) {
      const prevExistingCon = {label: 'MetaMask', disableModals: true}
      connect({autoSelect: prevExistingCon})
    } else {
      connect()
    }
  }, [connect, prevCon])

  return (
    <Box
      bg={colorMode === "light" ? "coolGray.50" : "coolGray.900"}
      minHeight="100vh"
      justifyContent="center"
      px={4}
    >
      <VStack space={5} alignItems="center">
        <Heading size="lg">Welcome to NativeBase</Heading>
        {wallet && (
          <Text>
            {wallet.label}
            <Box
              _text={{
                fontFamily: "monospace",
                fontSize: "sm",
              }}
              px={2}
              py={1}
              _dark={{ bg: "blueGray.800" }}
              _light={{ bg: "blueGray.200" }}
            >
              {wallet.accounts[0].address}
            </Box>
          </Text>
        )}
        {wallet ? (
          <Button onPress={disconnect as any}>Sign out</Button>
          ) : (
          <Button onPress={connectFN}>Sign In</Button>
        )}
        <ToggleDarkMode />
      </VStack>
    </Box>
  );
}

function ToggleDarkMode() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <HStack space={2}>
      <Text>Dark</Text>
      <Switch
        isChecked={colorMode === "light"}
        onToggle={toggleColorMode}
        aria-label={
          colorMode === "light" ? "switch to dark mode" : "switch to light mode"
        }
      />
      <Text>Light</Text>
    </HStack>
  );
}

export default App;
