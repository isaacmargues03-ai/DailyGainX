declare const CreateQrcode: {
    readonly body: {
        readonly type: "object";
        readonly required: readonly ["amount"];
        readonly properties: {
            readonly amount: {
                readonly type: "number";
                readonly description: "Valor da transação";
                readonly format: "float";
                readonly minimum: -3.402823669209385e+38;
                readonly maximum: 3.402823669209385e+38;
            };
            readonly external_id: {
                readonly type: "string";
                readonly description: "ID externo da transação gerado por você";
            };
            readonly postbackUrl: {
                readonly type: "string";
                readonly description: "URL de webhook para receber as informações sobre o pagamento.";
            };
            readonly payerQuestion: {
                readonly type: "string";
                readonly description: "Descrição referente a transação";
            };
            readonly payer: {
                readonly type: "object";
                readonly description: "Este objeto representa o pagador.";
                readonly properties: {
                    readonly name: {
                        readonly type: "string";
                        readonly description: "Nome completo do cliente ou nome comercial.";
                    };
                    readonly document: {
                        readonly type: "string";
                        readonly description: "O número de identificação fiscal do cliente (CPF para clientes individuais ou CNPJ para clientes empresariais)";
                    };
                    readonly email: {
                        readonly type: "string";
                        readonly description: "E-mail pessoal do cliente ou e-mail comercial";
                    };
                };
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly transactionId: {
                    readonly type: "string";
                    readonly examples: readonly ["4392d1d7e408d3cec04fm1zf3gv7vkq1"];
                };
                readonly external_id: {
                    readonly type: "string";
                    readonly examples: readonly [""];
                };
                readonly status: {
                    readonly type: "string";
                    readonly examples: readonly ["PENDING"];
                };
                readonly amount: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [15];
                };
                readonly calendar: {
                    readonly type: "object";
                    readonly properties: {
                        readonly expiration: {
                            readonly type: "integer";
                            readonly default: 0;
                            readonly examples: readonly [3000];
                        };
                        readonly dueDate: {
                            readonly type: "string";
                            readonly examples: readonly ["2024-10-07 04:41:05"];
                        };
                    };
                };
                readonly debtor: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly examples: readonly ["Monkey D. Luffy"];
                        };
                        readonly document: {
                            readonly type: "string";
                            readonly examples: readonly ["12924586666"];
                        };
                    };
                };
                readonly qrcode: {
                    readonly type: "string";
                    readonly examples: readonly ["00020126850014br.gov.bcb.pix2563pix.voluti.com.br/qr/v3/at/6ed39bf2-bdc2-42b8-a95b-13d2212146b25204000053039865802BR5925BS PAYMENTS SOLUTIONS LTD6008SALVADOR62070503***63048D9B"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly statusCode: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [401];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Erro de autorização"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const FazerUmPagamento: {
    readonly body: {
        readonly type: "object";
        readonly required: readonly ["amount", "creditParty"];
        readonly properties: {
            readonly amount: {
                readonly type: "number";
                readonly description: "Valor da transação";
                readonly format: "float";
                readonly minimum: -3.402823669209385e+38;
                readonly maximum: 3.402823669209385e+38;
            };
            readonly description: {
                readonly type: "string";
                readonly description: "Descrição referente a transação";
            };
            readonly external_id: {
                readonly type: "string";
                readonly description: "ID externo da transação gerado por você";
            };
            readonly creditParty: {
                readonly type: "object";
                readonly description: "Este objeto representa o destinatário.";
                readonly properties: {
                    readonly name: {
                        readonly type: "string";
                        readonly description: "Nome completo do cliente ou nome comercial que pertence a chave.";
                    };
                    readonly keyType: {
                        readonly type: "string";
                        readonly description: "Tipo de chave pix relatado no sumário";
                    };
                    readonly key: {
                        readonly type: "string";
                        readonly description: "A chave PIX da conta bancária de destino";
                    };
                    readonly taxId: {
                        readonly type: "string";
                        readonly description: "O número de identificação fiscal do cliente (CPF para clientes individuais ou CNPJ para clientes empresariais)";
                    };
                };
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
export { CreateQrcode, FazerUmPagamento };
