import {
  Text,
  Link,
  HStack,
  Heading,
  Switch,
  useColorMode,
  VStack,
  Box,
  Button,
} from "native-base";
import { useOpenLogin } from "./openlogin";

function App() {
  const { colorMode } = useColorMode();
  const { userInfo, login, logout } = useOpenLogin();

  return (
    <Box
      bg={colorMode === "light" ? "coolGray.50" : "coolGray.900"}
      minHeight="100vh"
      justifyContent="center"
      px={4}
    >
      <VStack space={5} alignItems="center">
        <Heading size="lg">Welcome to NativeBase</Heading>
        {userInfo && (
          <Text>
            Welcome, {userInfo.name}{' '}
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
              {userInfo.email}
            </Box>
          </Text>
        )}
        {userInfo ? (
          <Button onPress={logout}>Sign out</Button>
          ) : (
          <Button onPress={login}>Sign In</Button>
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
