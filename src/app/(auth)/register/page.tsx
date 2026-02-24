'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  const handleSendSms = () => {
    if (!phoneNumber) {
        toast({
            variant: 'destructive',
            title: 'Número necessário',
            description: 'Por favor, insira um número de telefone.',
        });
        return;
    }
    console.log('Sending SMS to:', phoneNumber);
    toast({
      title: 'Código SMS Enviado',
      description: `Um código foi enviado para ${phoneNumber}. (Simulação)`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'As senhas não coincidem',
        description: 'Por favor, verifique e tente novamente.',
      });
      return;
    }
    console.log('Registering with:', { email, password, phoneNumber });
    toast({
      title: 'Cadastro bem-sucedido! (Simulação)',
      description: 'Sua conta foi criada. Você pode fazer login agora.',
    });
  };

  return (
    <Card>
       <CardHeader className="text-center">
        <CardTitle className="text-2xl">Cadastro</CardTitle>
        <CardDescription>Crie sua conta para começar a investir.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número de telefone</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                type="tel"
                placeholder="(XX) XXXXX-XXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleSendSms}>
                Enviar
              </Button>
            </div>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Crie uma senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            />
          </div>
          <Button type="submit" className="w-full">
            Cadastrar
          </Button>
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
