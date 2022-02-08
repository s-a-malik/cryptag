import { useParams } from "react-router-dom";
import {
    Box,
    Center,
    useColorModeValue,
    Heading,
    Text,
    Stack,
    VStack,
    Image,
  } from '@chakra-ui/react';
  import {
    FormControl,
    FormLabel,
    FormErrorMessage,
    FormHelperText,
    RadioGroup,
    Radio
  } from '@chakra-ui/react'


  
  const IMAGE =
    'https://images.unsplash.com/photo-1518051870910-a46e30d9db16?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=1350&q=80';
  
  export function TaskPage() {
    let params = useParams()
    return (
      <Center py={12}>
        <Box
          role={'group'}
          p={6}
          maxW={'330px'}
          w={'full'}
          bg={useColorModeValue('white', 'gray.800')}
          boxShadow={'2xl'}
          rounded={'lg'}
          pos={'relative'}
          zIndex={1}>
          <Box
            rounded={'lg'}
            mt={-12}
            pos={'relative'}
            height={'230px'}
            _after={{
              transition: 'all .3s ease',
              content: '""',
              w: 'full',
              h: 'full',
              pos: 'absolute',
              top: 5,
              left: 0,
              backgroundImage: `url(${IMAGE})`,
              filter: 'blur(15px)',
              zIndex: -1,
            }}
            _groupHover={{
              _after: {
                filter: 'blur(20px)',
              },
            }}>
            <Image
              rounded={'lg'}
              height={230}
              width={282}
              objectFit={'cover'}
              src={IMAGE}
            />
          </Box>
          {/* <Stack pt={10} align={'center'}>
            <Text color={'gray.500'} fontSize={'sm'} textTransform={'uppercase'}>
              Brand - {params.taskId}
            </Text>
            <Heading fontSize={'2xl'} fontFamily={'body'} fontWeight={500}>
              Nice Chair, pink
            </Heading>
            <Stack direction={'row'} align={'center'}>
              <Text fontWeight={800} fontSize={'xl'}>
                $57
              </Text>
              <Text textDecoration={'line-through'} color={'gray.600'}>
                $199
              </Text>
            </Stack>
          </Stack> */}
          <FormControl as='fieldset'>
        <FormLabel as='legend'>Favorite Naruto Character</FormLabel>
        <RadioGroup defaultValue='Itachi'>
            <VStack spacing='24px'>
            <Radio value='Sasuke'>Sasuke</Radio>
            <Radio value='Nagato'>Nagato</Radio>
            <Radio value='Itachi'>Itachi</Radio>
            <Radio value='Sage of the six Paths'>Sage of the six Paths</Radio>
            </VStack>
        </RadioGroup>
        <FormHelperText>Select only if you're a fan.</FormHelperText>
        </FormControl>
        </Box>
      </Center>
    );
  }