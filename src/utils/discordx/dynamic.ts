import { ButtonComponent, MethodDecoratorEx } from "discordx";

export function ButtonComponents (ids: readonly string[]): MethodDecoratorEx {
  return (target, propertyKey, descriptor) => {
    for (const id of ids) {
      ButtonComponent({ id })(target, propertyKey, descriptor);
    }
  };
}
