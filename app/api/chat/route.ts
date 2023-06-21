import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse, LangChainStream, Message } from 'ai'
import { CallbackManager } from 'langchain/callbacks'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { AIChatMessage, HumanChatMessage } from 'langchain/schema'
import { Configuration, OpenAIApi } from 'openai-edge'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const session = await auth()

  // TODO: check want we want here
  // if (process.env.VERCEL_ENV !== 'preview') {
  //   if (session == null) {
  //     return new Response('Unauthorized', { status: 401 })
  //   }
  // }

  const { stream, handlers } = LangChainStream()

  const llm = new ChatOpenAI({
    // modelName: "gpt-3.5-turbo",
    // openAIApiKey: previewToken || process.env.OPENAI_API_KEY,
    azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    streaming: true,
    callbackManager: CallbackManager.fromHandlers(handlers)
  })

  llm
    .call(
      (messages as Message[]).map(m =>
        m.role == 'user'
          ? new HumanChatMessage(m.content)
          : new AIChatMessage(m.content)
      )
    )
    .catch(console.error)

  return new StreamingTextResponse(stream)

  // const configuration = new Configuration({
  //   apiKey: previewToken || process.env.OPENAI_API_KEY
  // })
  //
  // const openai = new OpenAIApi(configuration)
  //
  // const res = await openai.createChatCompletion({
  //   model: 'gpt-3.5-turbo',
  //   messages,
  //   temperature: 0.7,
  //   stream: true
  // })
  //
  // const stream = OpenAIStream(res, {
  //   async onCompletion(completion) {
  //     const title = json.messages[0].content.substring(0, 100)
  //     const userId = session?.user.id
  //     if (userId) {
  //       const id = json.id ?? nanoid()
  //       const createdAt = Date.now()
  //       const path = `/chat/${id}`
  //       const payload = {
  //         id,
  //         title,
  //         userId,
  //         createdAt,
  //         path,
  //         messages: [
  //           ...messages,
  //           {
  //             content: completion,
  //             role: 'assistant'
  //           }
  //         ]
  //       }
  //       await kv.hmset(`chat:${id}`, payload)
  //       await kv.zadd(`user:chat:${userId}`, {
  //         score: createdAt,
  //         member: `chat:${id}`
  //       })
  //     }
  //   }
  // })
  //
  // return new StreamingTextResponse(stream)
}
