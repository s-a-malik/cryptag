import { useState, useEffect, useContext } from 'react';
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
    Button,
    chakra
  } from '@chakra-ui/react';
  import {
    FormControl,
    FormLabel,
    FormErrorMessage,
    FormHelperText,
    RadioGroup,
    Radio
  } from '@chakra-ui/react';
  import {
    Link
  } from "react-router-dom";
import { UserContext } from '../../lib/UserContext';
import { getAddress } from '../../lib/metamask';


  
  const IMAGE =
    'https://images.unsplash.com/photo-1518051870910-a46e30d9db16?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=1350&q=80';
  const LABEL_OPTIONS = {
    "sasuke": 0,
    "nagato": 1, 
    "itachi": 2
  }

  const backendURL = 'http://localhost:3042';

  export function TaskPage() {
    let params = useParams()
    console.log(params)
    const [taskCompleted, setCompletion] = useState(false)
    const [data, setData] = useState({"imageUrl": "", "labelOptions": {}, "imageId": 0});
    const [value, setValue] = useState("default")

    // persist user state
    const { user, setUser } = useContext(UserContext);

    const url = `http://localhost:3042/tasks/${params.taskId}/get-next-image?labellerAddress=reg`;
    console.log("Fetched")

    const fetchData = async () => {
        try {
            const response = await fetch(url, {method: 'GET', headers: {
              'Content-Type': 'application/json'
            }});
            const responseData = await response.json();

            if (responseData.error) {
              setCompletion(true)
            } else {
            console.log(responseData.image)
            setData({
              "imageId": responseData.image[0],
              "imageUrl": responseData.image[1],
              "labelOptions": responseData.labelOptions
            });
          }
        } catch (error) {
            console.log("error", error);
        }
    };

    const setAddress = async () => {
      setUser({ address: await getAddress() })
    }


    useEffect(() => {
      setAddress();
      fetchData();
  }, []);

    async function submitLabel() {
      const body = {
        labellerAddress: user.address,
        labels: [[data.imageId, value]],
      };

      const requestURL = `http://localhost:3042/tasks/${params.taskId}/submit-labels`

      await fetch(requestURL, {
          method: 'POST', // *GET, POST, PUT, DELETE, etc.
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body) // body data type must match "Content-Type" header
      });

      await fetchData()
    }

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
            {taskCompleted &&
              <Box>
                You have already completed these tasks. Please go back to <Link to="/tasks">Tasks</Link>!
              </Box>
            }

            {!taskCompleted && 
                <>
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
                    backgroundImage: `url(${data.imageUrl})`,
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
                    src={data.imageUrl}
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
                <Box mt={6}>
                <FormControl as='fieldset'>
              <Center><FormLabel as='legend'>Label this image!</FormLabel></Center>
              <RadioGroup onChange={setValue} value={value}>
                  <VStack spacing='24px'>
                  {Object.keys(data.labelOptions).map(x => (
                    <Radio key={data.labelOptions[x]} value={`${data.labelOptions[x]}`}>{x}</Radio>
                  ))}
                  </VStack>
              </RadioGroup>
              <Center><Button mt={4} colorScheme='blue' onClick ={() => submitLabel()}>Submit</Button></Center>
              <Center><FormHelperText>Select only if you're sure.</FormHelperText></Center>
              </FormControl>
              </Box>
              </>
            }
      </Box>
      </Center>
    );
  }