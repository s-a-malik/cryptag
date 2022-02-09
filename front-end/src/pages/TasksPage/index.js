import { useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import {
    Flex,
    Circle,
    Box,
    Image,
    Badge,
    useColorModeValue,
    Icon,
    chakra,
    Tooltip,
    SimpleGrid,
    Heading
  } from '@chakra-ui/react';
  import { BsStar, BsStarFill, BsStarHalf } from 'react-icons/bs';
  import { FiShoppingCart, FiStar } from 'react-icons/fi';
  import Header from '../../components/Header'
import ConnectWalletButton from '../../components/ConnectWalletButton';
import { UserContext } from '../../lib/UserContext';

  const ACTIVE = "active"
  const EXPIRED = "expired"
  const COMPLETED = "completed"
  
  const testData = [
    {
      taskId: 1,
      taskSize: 34, 
      taskInfo: {
        taskName: "Wayfarer Classic",
        taskDesc: "Still awaiting",
        exampleUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=4600&q=80",
        numLabelsRequired: 34,
        status: "active"
      },
      contract: {
        contractAddress: 'test',
        funds: 5
      }
    },
    {
      taskId: 2,
      taskSize: 34, 
      taskInfo: {
        taskName: "Wayfarer Classic 2",
        taskDesc: "Still awaiting",
        exampleUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=4600&q=80",
        numLabelsRequired: 34,
        status: "expired"
      },
      contract: {
        contractAddress: 'test',
        funds: 5
      }
    },
    {
      taskId: 3,
      taskSize: 34, 
      taskInfo: {
        taskName: "Wayfarer Classic 2",
        taskDesc: "Still awaiting",
        exampleUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=4600&q=80",
        numLabelsRequired: 34,
        status: "completed"
      },
      contract: {
        contractAddress: 'test',
        funds: 5
      }
    },

];
  
  function Rating({ rating, numTasks }) {
    return (
      <Box d="flex" alignItems="center">
        {/* {Array(5)
          .fill('')
          .map((_, i) => {
            const roundedRating = Math.round(rating * 2) / 2;
            if (roundedRating - i >= 1) {
              return (
                <BsStarFill
                  key={i}
                  style={{ marginLeft: '1' }}
                  color={i < rating ? 'teal.500' : 'gray.300'}
                />
              );
            }
            if (roundedRating - i === 0.5) {
              return <BsStarHalf key={i} style={{ marginLeft: '1' }} />;
            }
            return <BsStar key={i} style={{ marginLeft: '1' }} />;
          })} */}
        <Box as="span" color="gray.600" fontSize="sm">
          {numTasks} task{numTasks > 1 && 's'}
        </Box>
      </Box>
    );
  }
  
  function TaskCard({data}) {
    let navigate = useNavigate()

    function getColor(status) {
      switch (status) {
        case ACTIVE: return "yellow"
        case EXPIRED: return "red"
        case COMPLETED: return "green"
      }
    }

    async function handleClick(event) {
      event.preventDefault()
      navigate(`/tasks/${data.taskId}`, {replace: true})
    }

    console.log(data)
    return (
      <Flex p={50} w="full" alignItems="center" justifyContent="center">
        <Box onClick={handleClick}
          bg={useColorModeValue('white', 'gray.800')}
          maxW="sm"
          borderWidth="1px"
          rounded="lg"
          shadow="lg"
          position="relative">
          {data.taskInfo.status && (
            <Circle
              size="10px"
              position="absolute"
              top={2}
              right={2}
              bg={`${getColor(data.taskInfo.status)}.200`}
            />
          )}
  
          <Image
            src={data.taskInfo.exampleUrl}
            alt={`Picture of ${data.taskInfo.taskName}`}
            roundedTop="lg"
          />
  
          <Box p="6">
            <Box d="flex" alignItems="baseline">
              {data.taskInfo.status && (
                <Badge rounded="full" px="2" fontSize="0.8em" colorScheme={getColor(data.taskInfo.status)}>
                  {data.taskInfo.status.charAt(0).toUpperCase()+data.taskInfo.status.slice(1)}
                </Badge>
              )}
            </Box>
            <Flex mt="1" justifyContent="space-between" alignContent="center">
              <Box
                fontSize="2xl"
                fontWeight="semibold"
                as="h4"
                lineHeight="tight"
                isTruncated>
                {data.taskInfo.taskName}
              </Box>
              <Tooltip
                label="Add to favourites"
                bg="white"
                placement={'top'}
                color={'gray.800'}
                fontSize={'1.2em'}>
                <chakra.a href={'#'} display={'flex'}>
                  <Icon as={FiStar} h={7} w={7} alignSelf={'center'} />
                </chakra.a>
              </Tooltip>
            </Flex>
  
            <Flex justifyContent="space-between" alignContent="center">
              <Rating rating={data.taskId} numTasks={data.taskSize} />
              <Box fontSize="2xl" color={useColorModeValue('gray.800', 'white')}>
                <Box as="span" color={'gray.600'} fontSize="lg">
                  ETH
                </Box>
                {data.contract.funds.toFixed(2)}
              </Box>
            </Flex>
          </Box>
        </Box>
      </Flex>
    );
  }

  export function TasksPage() {
    const [data, setData] = useState(testData);
    const { user, setUser } = useContext(UserContext);

    useEffect(() => {
        // console.log("User fetched", user)
        const url = "http://localhost:3042/tasks?showCompleted=true";
        console.log("Fetched")

        const fetchData = async () => {
            try {
                const response = await fetch(url, {method: 'GET', headers: {
                  'Content-Type': 'application/json'
                }});
                const responseData = await response.json();
                console.log(responseData.infoToDisplay)
                setData(responseData.infoToDisplay.map(el => ({
                  taskId: el.taskId,
                  taskSize: el.taskSize, 
                  taskInfo: {
                    taskName: el.taskInfo.taskName,
                    taskDesc: el.taskInfo.taskDescription,
                    exampleUrl: el.taskInfo.example,
                    numLabelsRequired: el.taskInfo.numLabelsRequired,
                    status: el.taskInfo.status
                  },
                  contract: {
                    contractAddress: el.contract.contractAddress,
                    funds: el.contract.funds
                  }
                })));
            } catch (error) {
                console.log("error", error);
            }
        };

        fetchData();
    }, []);

    return (
      <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
        <chakra.h1
          textAlign={'center'}
          fontSize={'4xl'}
          py={10}
          fontWeight={'bold'}>
          Tasks available for completion
        </chakra.h1>
        {/* <Heading size='xl'>What is our company doing?</Heading> */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 5, lg: 8 }}>
          {data.map(datum => <TaskCard key={datum.taskId} data={datum}/>)}
        </SimpleGrid>
      </Box>
    )
  }
  