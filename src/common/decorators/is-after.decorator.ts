import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator to ensure the end time is after the start time.
 * @param property The property name that contains the start time
 * @param validationOptions Additional validation options
 */
export function IsAfter(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfter',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions || {
        message: `${propertyName} must be after ${property}`,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          // Skip validation if either value is missing
          if (!value || !relatedValue) {
            return true;
          }

          // Convert to Date objects if they are strings
          const endDate = value instanceof Date ? value : new Date(value);
          const startDate =
            relatedValue instanceof Date
              ? relatedValue
              : new Date(relatedValue);

          // Check if the end date is after the start date
          return endDate.getTime() > startDate.getTime();
        },
      },
    });
  };
}
