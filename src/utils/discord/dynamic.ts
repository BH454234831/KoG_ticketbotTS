import { ButtonComponent, MethodDecoratorEx } from "discordx";

export function ButtonComponents (ids: readonly string[], map?: (id: string) => string): MethodDecoratorEx {
  return (target, propertyKey, descriptor) => {
    for (const id of ids) {
      const _id = map != null ? map(id) : id;

      ButtonComponent({ id: _id })(target, propertyKey, descriptor);
    }
  };
}
