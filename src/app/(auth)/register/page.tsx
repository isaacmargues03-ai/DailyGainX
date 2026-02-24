'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'As senhas não coincidem', description: 'Por favor, verifique e tente novamente.' });
      return;
    }
    if (!name || !email || !password) {
        toast({ variant: 'destructive', title: 'Campos incompletos', description: 'Nome de usuário, email e senha são obrigatórios.'});
        return;
    }

    setIsLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update user's auth profile with display name
        await updateProfile(user, {
            displayName: name
        });

        // Generate a referral code for the new user
        const newReferralCode = user.uid.slice(0, 8).toUpperCase();

        // Create user profile in Firestore
        await setDoc(doc(firestore, "users", user.uid), {
            id: user.uid,
            email: user.email,
            name: name,
            profilePictureUrl: user.photoURL || '',
            referralCode: newReferralCode,
            referralCodeUsed: referralCode || null,
            hasMadeFirstDeposit: false,
        });

        toast({
            title: 'Cadastro bem-sucedido!',
            description: 'Sua conta foi criada. Redirecionando para seu perfil.',
        });
        
        router.push('/profile'); // Redirect to profile page after successful registration and login

    } catch (error: any) {
        console.error("Registration Error: ", error);
        let description = 'Ocorreu um erro desconhecido.';
        switch (error.code) {
            case 'auth/email-already-in-use':
                description = 'Este email já está em uso por outra conta.';
                break;
            case 'auth/weak-password':
                description = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
                break;
            case 'auth/invalid-email':
                description = 'O formato do email é inválido.';
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

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Cadastro</CardTitle>
        <CardDescription>Crie sua conta para começar a investir.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Nome de usuário</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
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
               <div className="space-y-2">
                <Label htmlFor="referral-code">Código de Indicação (Opcional)</Label>
                <Input
                  id="referral-code"
                  type="text"
                  placeholder="Código de quem te convidou"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </>
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
    