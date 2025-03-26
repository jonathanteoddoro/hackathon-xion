from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse
from openai import OpenAI
import os
import json
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

required_vars = ["OPENAI_API_KEY", "EMAIL_SENDER", "EMAIL_PASSWORD"]
missing_vars = [var for var in required_vars if not os.environ.get(var)]

if missing_vars:
    print(f"Variáveis de ambiente não definidas: {', '.join(missing_vars)}")
    print("Por favor, crie um arquivo .env com essas variáveis.")

os.environ.setdefault("SMTP_SERVER", "smtp.gmail.com")
os.environ.setdefault("SMTP_PORT", "465")
os.environ.setdefault("API_BASE_URL", "http://localhost:3000/api")


API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:3000/api")

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

app = Flask(__name__)

def get_signing_client_by_phone(phone_number):
    """
    Gets signing client data from a phone number
    """
    try:
        response = requests.get(
            f"{API_BASE_URL}/transaction/signing-client-by-phone/{phone_number}"
        )
        return response.json()
    except Exception as e:
        print(f"Error getting signing client: {str(e)}")
        return {"success": False, "error": str(e)}
    
def send_email(destination, subject, text):
    """
    Sends an email to the destination email address with the given subject and text.
    """
    try:
        sender_email = os.environ.get("EMAIL_SENDER")
        sender_password = os.environ.get("EMAIL_PASSWORD")
        smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", "465"))
        
        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = destination
        message["Subject"] = subject
        
        message.attach(MIMEText(text, "plain"))
        
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(sender_email, sender_password)
            server.send_message(message)
            
        return f"Email enviado com sucesso para {destination}"
    except Exception as e:
        return f"Falha ao enviar email: {str(e)}"

def get_wallet_address():
    """
    Gets the wallet address associated with the configured mnemonic.
    """
    try:
        response = requests.get(f"{os.environ.get('API_BASE_URL')}/wallet/address")
        data = response.json()
        if data.get('success'):
            return data.get('address')
        else:
            return f"Erro ao obter endereço: {data.get('error')}"
    except Exception as e:
        return f"Falha ao obter endereço: {str(e)}"

def generate_wallet():
    """
    Generates a new wallet for testing purposes.
    """
    try:
        response = requests.post(f"{os.environ.get('API_BASE_URL')}/wallet/generate")
        data = response.json()
        if data.get('success'):
            wallet = data.get('wallet')
            return wallet.get('mnemonic')
        else:
            return f"Erro ao gerar carteira: {data.get('error')}"
    except Exception as e:
        return f"Falha ao gerar carteira: {str(e)}"

def get_balance(address, denom="uxion"):
    """
    Gets the token balance for the specified address.
    """
    try:
        response = requests.get(f"{os.environ.get('API_BASE_URL')}/query/balance/{address}?denom={denom}")
        data = response.json()
        if data.get('success'):
            return f"Saldo de {address}: {data.get('balance')} {denom}"
        else:
            return f"Erro ao obter saldo: {data.get('error')}"
    except Exception as e:
        return f"Falha ao obter saldo: {str(e)}"

def send_tokens(recipient_address, amount, denom="uxion", memo=""):
    """
    Sends tokens from your wallet to a recipient address.
    """
    try:
        payload = {
            "recipientAddress": recipient_address,
            "amount": amount,
            "denom": denom,
            "memo": memo
        }
        response = requests.post(f"{os.environ.get('API_BASE_URL')}/transaction/send", json=payload)
        data = response.json()
        if data.get('success'):
            result = data.get('result')
            return f"Tokens enviados com sucesso!\nHash da transação: {result.get('transactionHash')}\nGás utilizado: {result.get('gasUsed')}"
        else:
            return f"Erro ao enviar tokens: {data.get('error')}"
    except Exception as e:
        return f"Falha ao enviar tokens: {str(e)}"

def get_tx_info(tx_hash):
    """
    Gets information about a transaction by its hash.
    """
    try:
        response = requests.get(f"{os.environ.get('API_BASE_URL')}/query/transaction/{tx_hash}")
        data = response.json()
        if data.get('success'):
            tx = data.get('transaction')
            return f"Detalhes da transação:\nHash: {tx_hash}\nStatus: {tx.get('code', 0) == 0 and 'Sucesso' or 'Falha'}"
        else:
            return f"Erro ao obter informações da transação: {data.get('error')}"
    except Exception as e:
        return f"Falha ao obter informações da transação: {str(e)}"

def register_phone(phone_number, memo=""):
    """
    Registers a phone number with the API server
    """
    try:
        response = requests.post(
            f"{API_BASE_URL}/transaction/save-phone-memo",
            json={"phoneNumber": phone_number, "memo": memo}
        )
        return response.json()
    except Exception as e:
        print(f"Error registering phone: {str(e)}")
        return {"success": False, "error": str(e)}
    
def process_with_function_calling(user_message, conversation_history=[]):
    tools = [
        {
            "type": "function",
            "function": {
                "name": "send_email",
                "description": "Envia um email para o destinatário especificado",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "destination": {
                            "type": "string",
                            "description": "O endereço de email do destinatário"
                        },
                        "subject": {
                            "type": "string",
                            "description": "O assunto do email"
                        },
                        "text": {
                            "type": "string",
                            "description": "O conteúdo do email"
                        }
                    },
                    "required": ["destination", "subject", "text"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_wallet_address",
                "description": "Obtém o endereço da carteira configurada no sistema",
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_balance",
                "description": "Obtém o saldo de tokens para um endereço específico",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "address": {
                            "type": "string",
                            "description": "O endereço da carteira a ser consultada"
                        },
                        "denom": {
                            "type": "string",
                            "description": "A denominação do token (padrão: uxion)"
                        }
                    },
                    "required": ["address"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "send_tokens",
                "description": "Envia tokens da sua carteira para um endereço destinatário",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "recipient_address": {
                            "type": "string",
                            "description": "O endereço do destinatário"
                        },
                        "amount": {
                            "type": "string",
                            "description": "A quantidade de tokens a enviar"
                        },
                        "denom": {
                            "type": "string",
                            "description": "A denominação do token (padrão: uxion)"
                        },
                        "memo": {
                            "type": "string",
                            "description": "Um memo opcional para a transação"
                        }
                    },
                    "required": ["recipient_address", "amount"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_tx_info",
                "description": "Obtém informações sobre uma transação pelo seu hash",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "tx_hash": {
                            "type": "string",
                            "description": "O hash da transação"
                        }
                    },
                    "required": ["tx_hash"]
                }
            }
        }
    ]
    
    messages = [
        {"role": "system", "content": """
        Você é um assistente especializado em blockchain Xion que pode ajudar com várias operações:
        1. Verificar endereços de carteira
        3. Verificar saldos
        4. Enviar tokens
        5. Obter informações sobre transações
        6. Enviar emails
        
        Quando o usuário solicitar uma operação de blockchain:
        1. Peça confirmação antes de realizar operações irreversíveis como envio de tokens
        2. Explique os resultados de forma clara e simples
        3. Ofereça sugestões de próximos passos
        
        Quando enviar emails, peça confirmação dos detalhes antes de enviá-los.
        """}
    ]
    
    for msg in conversation_history:
        messages.append(msg)
    
    messages.append({"role": "user", "content": user_message})
    
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        tools=tools,
        tool_choice="auto"
    )
    
    response_message = completion.choices[0].message
    
    if response_message.tool_calls:
        for tool_call in response_message.tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            if function_name == "send_email":
                function_response = send_email(
                    destination=function_args.get("destination"),
                    subject=function_args.get("subject"),
                    text=function_args.get("text")
                )
            elif function_name == "get_wallet_address":
                function_response = get_wallet_address()
            elif function_name == "get_balance":
                function_response = get_balance(
                    address=function_args.get("address"),
                    denom=function_args.get("denom", "uxion")
                )
            elif function_name == "send_tokens":
                function_response = send_tokens(
                    recipient_address=function_args.get("recipient_address"),
                    amount=function_args.get("amount"),
                    denom=function_args.get("denom", "uxion"),
                    memo=function_args.get("memo", "")
                )
            elif function_name == "get_tx_info":
                function_response = get_tx_info(
                    tx_hash=function_args.get("tx_hash")
                )
            else:
                function_response = f"Function {function_name} not implemented"
            
            messages.append({"role": "assistant", "content": None, "tool_calls": [tool_call.model_dump()]})
            
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": function_name,
                "content": function_response
            })
            
            second_completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages
            )
            
            return second_completion.choices[0].message.content, messages
        
    return response_message.content, messages + [{"role": "assistant", "content": response_message.content}]

user_conversations = {}

@app.route("/chat", methods=["POST"])
def webhook():
    
    user_message = request.form.get('Body', '')
    sender_id = request.form.get('From', '')
    sender_id = sender_id.split(':')[1] if ':' in sender_id else sender_id

    signing_client = get_signing_client_by_phone(sender_id)
    
    if not signing_client.get("success"):
        register_response = register_phone(sender_id, generate_wallet())
        print(register_response)
    
    print(f"Received message from {sender_id}: {user_message}")
    
    if sender_id not in user_conversations:
        user_conversations[sender_id] = []
    
    response, updated_conversation = process_with_function_calling(
        user_message, 
        user_conversations[sender_id]
    )
    
    user_conversations[sender_id] = updated_conversation
    
    resp = MessagingResponse()
    message = resp.message()
    message.body(response)
    
    return str(resp)

if __name__ == "__main__":
    app.run(port=8080, debug=True)
