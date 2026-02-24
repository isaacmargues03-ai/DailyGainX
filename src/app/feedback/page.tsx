'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function FeedbackPage() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o assunto e a sua mensagem.',
      });
      return;
    }
    
    // Here you would typically send the feedback to a server
    console.log('Feedback submitted:', { subject, message });

    toast({
      title: 'Feedback Enviado!',
      description: 'Obrigado pela sua opinião. Ela é muito importante para nós.',
    });
    
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 p-4 sm:p-6">
        <div className="container mx-auto max-w-2xl">
          
          {submitted ? (
            <Card className="mt-8">
                <CardContent className="p-8 text-center flex flex-col items-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-2xl font-semibold mb-2">Obrigado!</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">Sua opinião foi enviada com sucesso e será analisada pela nossa equipe.</p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/profile">Voltar ao Perfil</Link>
                        </Button>
                        <Button onClick={() => setSubmitted(false)} className="w-full">Enviar outro feedback</Button>
                    </div>
                </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Deixe seu Feedback</h1>
                <p className="text-muted-foreground mt-2">Sua opinião nos ajuda a melhorar a plataforma.</p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-6 w-6"/>
                    Formulário de Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto</Label>
                      <Input 
                        id="subject" 
                        placeholder="Ex: Sugestão para o app" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Sua Mensagem</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Digite sua mensagem aqui..." 
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg">Enviar Feedback</Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
