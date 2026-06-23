import { registerDecorator, type ValidationOptions } from 'class-validator';

export function IsPassword(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object, propertyName) => {
    registerDecorator({
      propertyName: propertyName as string,
      name: 'isPassword',
      target: object.constructor,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          return /^[\x20-\x7E]+$/.test(value); // Allow any printable ASCII characters
        },
        defaultMessage() {
          return `$property is invalid`;
        },
      },
    });
  };
}
