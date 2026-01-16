import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdatePreferencesDto } from './update-preferences.dto';

describe('UpdatePreferencesDto', () => {
  /**
   * ✅ TEST QUE PASA - Valida que se aceptan valores válidos
   */
  it('should accept valid theme values', async () => {
    const dto = plainToInstance(UpdatePreferencesDto, { theme: 'dark' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * ✅ TEST QUE PASA - Valida que se rechazan valores inválidos
   */
  it('should reject invalid theme values', async () => {
    const dto = plainToInstance(UpdatePreferencesDto, { theme: 'invalid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isIn');
  });

  /**
   * ✅ TEST QUE PASA - Valida DTO vacío (todos campos opcionales)
   */
  it('should accept empty dto', async () => {
    const dto = plainToInstance(UpdatePreferencesDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * ✅ TEST QUE PASA - Valida campo notifications como booleano
   */
  it('should accept boolean notifications', async () => {
    const dto = plainToInstance(UpdatePreferencesDto, { notifications: true });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  /**
   * 📝 TODO: El candidato debe añadir más tests de validación
   */
  it.todo('should reject non-boolean notifications');
  it.todo('should accept valid language string');
  it.todo('should accept multiple valid fields');
});
