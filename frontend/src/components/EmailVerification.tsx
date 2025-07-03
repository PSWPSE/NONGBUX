import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  Spinner,
  Heading,
  Input,
} from '@chakra-ui/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail, resendVerificationEmail } from '../services/api';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleVerification(token);
    } else {
      setShowResendForm(true);
    }
  }, [token]);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleVerification = async (verificationToken: string) => {
    setIsLoading(true);
    try {
      await verifyEmail({ token: verificationToken });
      setIsVerified(true);
      showMessage('이메일 인증이 완료되었습니다! 이제 로그인할 수 있습니다.', 'success');
      
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
      showMessage(error.response?.data?.detail || '인증 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      showMessage('이메일 주소를 입력해주세요.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await resendVerificationEmail({ email });
      showMessage('인증 이메일을 다시 발송했습니다. 이메일을 확인해주세요.', 'success');
    } catch (error: any) {
      showMessage(error.response?.data?.detail || '이메일 발송 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
      >
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text>인증 처리 중...</Text>
        </VStack>
      </Box>
    );
  }

  if (isVerified) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
      >
        <Box maxW="md" w="full" bg="white" p={8} borderRadius="md" boxShadow="md">
          <VStack>
            <Heading size="lg" color="green.500">
              ✅ 인증 완료!
            </Heading>
            <Text color="green.600">
              이메일 인증이 완료되었습니다. 곧 로그인 페이지로 이동합니다.
            </Text>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
    >
      <Box maxW="md" w="full" bg="white" p={8} borderRadius="md" boxShadow="md">
        <VStack>
          <Heading size="lg">이메일 인증</Heading>
          
          {message && (
            <Box
              w="full"
              p={3}
              borderRadius="md"
              bg={messageType === 'success' ? 'green.100' : 'red.100'}
              color={messageType === 'success' ? 'green.700' : 'red.700'}
              border="1px solid"
              borderColor={messageType === 'success' ? 'green.300' : 'red.300'}
            >
              <Text fontSize="sm">{message}</Text>
            </Box>
          )}
          
          {!token && showResendForm ? (
            <>
              <Text textAlign="center" color="gray.600">
                인증 이메일을 받지 못하셨나요? 이메일 주소를 입력하시면 인증 이메일을 다시 발송해드립니다.
              </Text>
              
              <Box w="full">
                <Text mb={2} fontWeight="medium">이메일 주소</Text>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                />
              </Box>
              
              <Button
                colorScheme="blue"
                onClick={handleResendEmail}
                disabled={isLoading}
                w="full"
              >
                인증 이메일 재발송
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
              >
                로그인 페이지로 돌아가기
              </Button>
            </>
          ) : (
            <Box
              w="full"
              p={3}
              borderRadius="md"
              bg="red.100"
              color="red.700"
              border="1px solid"
              borderColor="red.300"
            >
              <Text fontSize="sm">유효하지 않은 인증 링크입니다.</Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default EmailVerification; 