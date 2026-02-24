'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, linkWithCredential, EmailAuthProvider, ConfirmationResult } from 'firebase/auth';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

export default function RegisterPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [isLoading, setIsLoading] = useState(false);
  
  const { auth } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 'form' && recaptchaContainerRef.current) {
        // Ensure we don't re-initialize the verifier
        if (!window.recaptchaVerifier?.auth) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
              'size': 'invisible',
              'callback': (response: any) => {
                console.log("reCAPTCHA solved, proceeding with SMS.");
              },
              'expired-callback': () => {
                toast({ variant: 'destructive', title: 'reCAPTCHA expirado', description: 'Por favor, tente enviar o SMS novamente.' });
              }
            });
            window.recaptchaVerifier.render().catch(err => {
              console.error("Recaptcha render error", err);
              toast({ variant: 'destructive', title: 'Erro no reCAPTCHA', description: 'Não foi possível carregar o verificador reCAPTCHA.' });
            });
        }
    }
  }, [auth, step, toast]);


  const handleSendSms = async () => {
    if (!phoneNumber) {
      toast({ variant: 'destructive', title: 'Número necessário', description: 'Por favor, insira um número de telefone válido.' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'As senhas não coincidem', description: 'Por favor, verifique e tente novamente.' });
      return;
    }
    if (!email || !password) {
        toast({ variant: 'destructive', title: 'Campos incompletos', description: 'Email e senha são obrigatórios.'});
        return;
    }

    setIsLoading(true);
    try {
      const verifier = window.recaptchaVerifier;
      // Make sure to use E.164 format for phone number, e.g., +15551234567
      const formattedPhoneNumber = `+${phoneNumber.replace(/\D/g, '')}`;
      
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, verifier);
      window.confirmationResult = confirmationResult;

      toast({
        title: 'Código SMS Enviado',
        description: `Um código foi enviado para ${formattedPhoneNumber}.`,
      });
      setStep('code');
    } catch (error: any) {
      console.error("SMS Error:", error);
      let title = 'Erro ao enviar SMS';
      let description = 'Não foi possível enviar o código. Verifique o número e tente novamente.';

      switch (error.code) {
          case 'auth/invalid-phone-number':
              description = 'O número de telefone fornecido não é válido. Certifique-se de que está no formato internacional (ex: +5511912345678).';
              break;
          case 'auth/too-many-requests':
              description = 'Muitas solicitações. Por favor, tente novamente mais tarde.';
              break;
          case 'auth/operation-not-allowed':
              title = 'Ação necessária no Firebase';
              description = 'Ative o provedor "Telefone" no seu Firebase Console em: Authentication > Sign-in method.';
              break;
          default:
              description = `Ocorreu um erro inesperado: ${error.message}`;
      }

      toast({
        variant: 'destructive',
        title: title,
        description,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
        toast({ variant: 'destructive', title: 'Código inválido', description: 'Por favor, insira o código de verificação de 6 dígitos.' });
        return;
    }

    setIsLoading(true);
    try {
        const confirmationResult = window.confirmationResult;
        // First, confirm the phone verification code
        const userCredential = await confirmationResult.confirm(verificationCode);
        const user = userCredential.user;
        
        // After phone is verified, create an email/password credential and link it.
        const emailCredential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(user, emailCredential);

        toast({
            title: 'Cadastro bem-sucedido!',
            description: 'Sua conta foi criada com telefone e email. Você será redirecionado para o login.',
        });
        
        // Sign out the user before redirecting to login for a clean flow
        await auth.signOut();
        router.push('/login');

    } catch (error: any) {
        console.error("Registration Error: ", error);
        let description = 'Ocorreu um erro desconhecido.';
        switch (error.code) {
            case 'auth/invalid-verification-code':
                description = 'O código de verificação está incorreto. Tente novamente.';
                break;
            case 'auth/email-already-in-use':
                description = 'Este email já está em uso por outra conta.';
                break;
            case 'auth/weak-password':
                description = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
                break;
            case 'auth/credential-already-in-use':
                description = 'Esta credencial (email ou telefone) já está associada a outra conta de usuário.';
                break;
            default:
                description = `Ocorreu um erro durante o cadastro: ${error.message}`;
        }
        toast({
            variant: 'destructive',
            title: 'Falha no Cadastro',
            description,
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'form') {
        handleSendSms();
    } else {
        handleRegister();
    }
  }


  return (
    <Card>
      <div ref={recaptchaContainerRef}></div>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Cadastro</CardTitle>
        <CardDescription>Crie sua conta para começar a investir.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'form' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Número de telefone</Label>
                <Input
                    id="phone"
                    type="tel"
                    placeholder="+5511912345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                    required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Gmail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo de 6 caracteres"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirme sua senha"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Enviando SMS...' : 'Enviar SMS de Verificação'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">Código de Verificação</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Digite o código de 6 dígitos"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={isLoading}
                />
              </div>
               <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verificando...' : 'Cadastrar'}
              </Button>
               <Button variant="link" size="sm" className="w-full" onClick={() => setStep('form')} disabled={isLoading}>
                    Voltar para o formulário
                </Button>
            </>
          )}
        </form>
        <div className="mt-4 text-center text-sm">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Faça login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
