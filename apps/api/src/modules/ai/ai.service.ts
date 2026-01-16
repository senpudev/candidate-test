import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// TODO: Descomentar cuando el candidato implemente la integración real
// import OpenAI from 'openai';

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
  // TODO: Descomentar cuando el candidato implemente la integración real
  // private openai: OpenAI;

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
    // TODO: El candidato debe inicializar el cliente de OpenAI
    // const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    // if (apiKey) {
    //   this.openai = new OpenAI({ apiKey });
    // }
  }

  /**
   * ✅ ESTRUCTURA BASE - Genera respuesta del asistente
   *
   * Actualmente retorna una respuesta placeholder.
   * El candidato debe:
   * 1. Implementar la llamada real a OpenAI
   * 2. Manejar errores de la API
   * 3. Implementar retry logic si es necesario
   * 4. Considerar rate limiting
   */
  async generateResponse(
    userMessage: string,
    history: MessageHistory[] = []
  ): Promise<AiResponse> {
    this.logger.debug(`Generando respuesta para: "${userMessage.substring(0, 50)}..."`);

    // TODO: El candidato debe implementar la llamada real a OpenAI
    // Ejemplo de implementación esperada:
    //
    // const messages = [
    //   { role: 'system', content: this.baseSystemPrompt },
    //   ...history,
    //   { role: 'user', content: userMessage },
    // ];
    //
    // const completion = await this.openai.chat.completions.create({
    //   model: 'gpt-3.5-turbo',
    //   messages,
    //   temperature: 0.7,
    //   max_tokens: 500,
    // });
    //
    // return {
    //   content: completion.choices[0].message.content,
    //   tokensUsed: completion.usage?.total_tokens,
    //   model: completion.model,
    // };

    // Respuesta placeholder mientras no está implementado
    return this.generatePlaceholderResponse(userMessage);
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
   * 📝 TODO: Implementar generacion de respuesta con RAG
   *
   * El candidato debe:
   * 1. Usar KnowledgeService para buscar contexto relevante
   * 2. Incluir el contexto en el prompt
   * 3. Llamar a OpenAI con el contexto enriquecido
   */
  async generateResponseWithRAG(
    userMessage: string,
    history: MessageHistory[] = [],
    relevantContext?: string[]
  ): Promise<AiResponse> {
    // TODO: Implementar
    // El candidato debe:
    // 1. Construir un prompt que incluya el contexto relevante
    // 2. Llamar a OpenAI con el contexto
    throw new Error('Not implemented');
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
