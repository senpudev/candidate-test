import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai'; // OpenAI SDK v4.20.0

interface MessageHistory {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AiResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai?: OpenAI;

  /**
   * System prompt base para el asistente de estudiantes
   * El candidato puede modificar o extender este prompt
   */
  private readonly baseSystemPrompt = `Eres un asistente educativo amigable y servicial para estudiantes de una plataforma de cursos online.

Tu objetivo es:
- Ayudar a los estudiantes con dudas sobre el contenido de sus cursos
- Motivar y dar apoyo emocional cuando sea necesario
- Sugerir recursos y técnicas de estudio
- Responder de forma clara, concisa y amigable

Reglas:
- No des respuestas a exámenes directamente, guía al estudiante para que llegue a la respuesta
- Si no sabes algo, admítelo y sugiere buscar ayuda adicional
- Mantén un tono positivo y motivador
- Usa ejemplos prácticos cuando sea posible`;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized');
    } else {
      this.logger.warn('OPENAI_API_KEY not found in environment variables');
    }
  }

  /**
   * ✅ ESTRUCTURA BASE - Genera respuesta del asistente
   * ✅ IMPLEMENTADO (unificado con RAG: si relevantContext está presente, se enriquece el system prompt)
   *
   * Actualmente retorna una respuesta placeholder si OpenAI no está configurado.
   * El candidato debe:
   * 1. ✅ Implementar la llamada real a OpenAI
   * 2. ✅ Manejar errores de la API
   * 3. ⚠️ Implementar retry logic si es necesario (no implementado aún)
   * 4. ⚠️ Considerar rate limiting (no implementado aún)
   */
  async generateResponse(
    userMessage: string,
    history: MessageHistory[] = [],
    relevantContext?: string[]
  ): Promise<AiResponse> {
    const useRAG = relevantContext && relevantContext.length > 0;
    this.logger.debug(
      `Generating response ${useRAG ? 'with RAG' : 'basic'} for: "${userMessage.substring(0, 50)}..."`
    );

    if (!this.openai) {
      this.logger.warn('OpenAI client not initialized, returning placeholder response');
      return this.generatePlaceholderResponse(userMessage);
    }

    try {
      
      let systemPrompt = this.baseSystemPrompt;
      if (useRAG) {
        // Enrich system prompt with RAG context if available (relevantContext)
        const contextText = relevantContext!
          .map((ctx, i) => `[Contexto ${i + 1}]: ${ctx}`)
          .join('\n\n');
        systemPrompt += `\n\n--- CONTEXTO RELEVANTE DEL CURSO ---\n${contextText}\n\nUsa este contexto para dar respuestas más precisas y específicas sobre el contenido del curso.`;
        this.logger.debug(`RAG context included: ${relevantContext.length} chunks`);
      }

      // {system prompt (Enriched opt), history, user message}
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.map((msg) => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7, // Balance between creativity and consistency
        max_tokens: 500, // Enough maybe for an educational chat
      });

      const responseContent = completion.choices[0]?.message?.content || '';
      if (!responseContent) {
        throw new Error('Empty response from OpenAI');
      }

      return {
        content: responseContent,
        tokensUsed: completion.usage?.total_tokens,
        model: completion.model,
      };
    } catch (error) {
      this.logger.error(`Error calling OpenAI API: ${error.message}`, error.stack);
      return this.generatePlaceholderResponse(userMessage);
    }
  }

  // Create embedding from text using OpenAI API (text-embedding-3-small)
  async createEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please configure OPENAI_API_KEY');
    }
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      const embedding = response.data[0]?.embedding;
      if (!embedding || embedding.length === 0) {
        throw new Error('Empty embedding returned from OpenAI');
      }
      return embedding;
    } catch (error) {
      this.logger.error(`Error creating embedding: ${error instanceof Error ? error.message : error}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
  
  /**
   * 📝 TODO: Implementar streaming de respuestas
   *
   * El candidato debe implementar streaming real con OpenAI.
   * Consultar la documentación oficial de OpenAI para la implementación.
   */
  async *generateStreamResponse(
    userMessage: string,
    history: MessageHistory[] = []
  ): AsyncGenerator<string> {
    // TODO: Implementar streaming real con OpenAI
    // Placeholder actual - simula streaming
    const placeholder = await this.generatePlaceholderResponse(userMessage);
    const words = placeholder.content.split(' ');

    for (const word of words) {
      yield word + ' ';
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  /**
   * 📝 TODO: Implementar manejo de contexto personalizado
   *
   * El candidato debe implementar un método que:
   * - Acepte información del estudiante (nombre, cursos, progreso)
   * - Genere un system prompt personalizado
   * - Incluya el contexto en las llamadas a OpenAI
   */
  buildContextualSystemPrompt(studentContext: {
    name: string;
    currentCourse?: string;
    progress?: number;
  }): string {
    // TODO: Implementar personalizacion del prompt
    return this.baseSystemPrompt;
  }

  /**
   * Genera una respuesta placeholder para desarrollo
   */
  private generatePlaceholderResponse(userMessage: string): AiResponse {
    const responses = [
      '¡Hola! Soy tu asistente de estudios. Veo que tienes una pregunta interesante. Para ayudarte mejor, ¿podrías darme más detalles sobre el tema específico del curso en el que necesitas ayuda?',
      'Entiendo tu duda. Este es un tema importante que muchos estudiantes encuentran desafiante. Te sugiero que revisemos los conceptos paso a paso. ¿Por dónde te gustaría empezar?',
      '¡Excelente pregunta! Esto demuestra que estás pensando críticamente sobre el material. Déjame darte una explicación que te ayude a entender mejor el concepto.',
      'Gracias por compartir tu pregunta. Para darte la mejor ayuda posible, necesito que OpenAI esté configurado. Por ahora, te recomiendo revisar el material del curso y volver con preguntas específicas.',
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      content: `[RESPUESTA PLACEHOLDER - Implementar OpenAI]\n\n${randomResponse}`,
      tokensUsed: 0,
      model: 'placeholder',
    };
  }

  /**
   * Verifica si OpenAI está configurado
   */
  isConfigured(): boolean {
    return !!this.configService.get<string>('OPENAI_API_KEY');
  }
}
