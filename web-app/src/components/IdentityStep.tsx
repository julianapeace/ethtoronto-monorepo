import { Box, Button, Divider, Heading, HStack, Link, ListItem, OrderedList, Text, Tooltip, useToast, VStack, IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer } from "@chakra-ui/react"
import { CopyIcon } from '@chakra-ui/icons'
import { Identity } from "@semaphore-protocol/identity"
import { useCallback, useEffect, useState } from "react"
import IconAddCircleFill from "../icons/IconAddCircleFill"
import IconRefreshLine from "../icons/IconRefreshLine"
import Stepper from "./Stepper"

export type IdentityStepProps = {
    onNextClick: () => void
    onChange: (identity: Identity) => void
    onLog: (message: string) => void
}

export default function IdentityStep({ onChange, onNextClick, onLog }: IdentityStepProps) {
    const [_identity, setIdentity] = useState<Identity>()

    useEffect(() => {
        const identityString = localStorage.getItem("identity")

        if (identityString) {
            const identity = new Identity(identityString)
            setIdentity(identity)
            console.log('identity', identity)
            onChange(identity)
            onLog("Your Semaphore identity was retrieved from the browser cache 👌🏽")
        } else {
            onLog("Create your Semaphore identity 👆🏽")
        }
    }, [])
    const toast = useToast()
    const copyToClipboard = async function (value: string) {
      navigator.clipboard.writeText(value)
      toast({
          title: 'Copied',
          // description: "We've created your account for you.",
          status: 'success',
          duration: 6000,
          isClosable: true,
        })
    }

    const createIdentity = useCallback(async () => {
        const identity = new Identity()
        setIdentity(identity)
        localStorage.setItem("identity", identity.toString())
        onChange(identity)
        onLog("Your new Semaphore identity was just created 🎉")
    }, [])

    return (
        <>
            <Heading as="h2" size="xl">
                Identities
            </Heading>

            <Text pt="2" fontSize="md">
                Users interact with the protocol using a Semaphore{" "}
                <Link href="https://semaphore.appliedzkp.org/docs/guides/identities" color="primary.500" isExternal>
                    identities
                </Link>{" "}
                (similar to Ethereum accounts). It contains three values:
            </Text>
            <OrderedList pl="20px" pt="5px" spacing="3">
                <ListItem>Trapdoor: private, known only by user</ListItem>
                <ListItem>Nullifier: private, known only by user</ListItem>
                <ListItem>Commitment: public</ListItem>
            </OrderedList>

            <Divider pt="5" borderColor="gray.500" />

            <HStack pt="5" justify="space-between">
                <Text fontWeight="bold" fontSize="lg">
                    Identity
                </Text>
                {_identity && (
                    <Button leftIcon={<IconRefreshLine />} variant="link" color="text.700" onClick={createIdentity}>
                        New
                    </Button>
                )}
            </HStack>

            {_identity ? (
                <Box w="100%" py="6">
                    <TableContainer>
                      <Table variant='simple' size='sm'>
                        <Thead>
                          <Tr>
                            <Th>Name</Th>
                            <Th>Hash</Th>
                            <Th>Copy</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          <Tr>
                            <Td>Trapdoor</Td>
                            <Td>{_identity.getTrapdoor().toString().substring(0, 30)}...</Td>
                            <Td><IconButton aria-label='Trapdoor' icon={<CopyIcon />} onClick={() =>  copyToClipboard(_identity.getTrapdoor())}/> </Td>
                          </Tr>
                          <Tr>
                            <Td>Nullifier</Td>
                            <Td>{_identity.getNullifier().toString().substring(0, 30)}...</Td>
                            <Td><IconButton aria-label='Nullifier'  icon={<CopyIcon />} onClick={() => copyToClipboard(_identity.getNullifier())}/></Td>
                          </Tr>
                          <Tr>
                            <Td>Commitment</Td>
                            <Td>{_identity.generateCommitment().toString().substring(0, 30)}...</Td>
                            <Td><IconButton aria-label='Commitment'  icon={<CopyIcon />} onClick={() =>  copyToClipboard(_identity.generateCommitment())}/></Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                </Box>
            ) : (
                <Box py="6">
                    <Button
                        w="100%"
                        fontWeight="bold"
                        justifyContent="left"
                        colorScheme="primary"
                        px="4"
                        onClick={createIdentity}
                        leftIcon={<IconAddCircleFill />}
                    >
                        Create identity
                    </Button>
                </Box>
            )}

            <Divider pt="3" borderColor="gray" />

            <Stepper step={1} onNextClick={!!_identity && onNextClick} />
        </>
    )
}
