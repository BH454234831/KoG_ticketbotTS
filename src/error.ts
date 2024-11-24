export type ExtraErrorDataValue = string | number | boolean | null | undefined;

export class ExtraError extends Error {
  public readonly data: Record<string, ExtraErrorDataValue>;

  public constructor (options: { message: string; data: Record<string, ExtraErrorDataValue> } & ErrorOptions) {
    super(options.message, options);
    this.data = options.data;
  }

  public override readonly name: string = 'ExtraError';
  public readonly [Symbol.toStringTag]: string = 'ExtraError';
}

export class DisplayError extends ExtraError {
  public readonly displayMessage: string;

  public constructor (options: { message: string; displayMessage: string; data: Record<string, ExtraErrorDataValue> } & ErrorOptions) {
    super(options);
    this.displayMessage = options.displayMessage;
  }

  public override readonly name: string = 'DisplayError';
  public override readonly [Symbol.toStringTag]: string = 'DisplayError';
}

export class IssueError extends ExtraError {
  public override readonly name: string = 'IssueError';
  public override readonly [Symbol.toStringTag]: string = 'IssueError';
}

export class DisplayErrorUserMissingPermissions extends DisplayError {
  public constructor (options: { message: string; data: Record<string, ExtraErrorDataValue> } & ErrorOptions) {
    super({
      ...options,
      displayMessage: 'You are missing permissions to perform this action.',
    });
  }

  public override readonly name = 'DisplayErrorUserMissingPermissions';
  public override readonly [Symbol.toStringTag] = 'DisplayErrorUserMissingPermissions';
}

export class DisplayErrorBotMissingPermissions extends DisplayError {
  public constructor (options: { message: string; permissions: string[]; data: Record<string, ExtraErrorDataValue> } & ErrorOptions) {
    super({
      ...options,
      displayMessage: `I am missing permissions to perform this action: \`${options.permissions.join(',')}\``,
    });
  }

  public override readonly name = 'DisplayErrorBotMissingPermissions';
  public override readonly [Symbol.toStringTag] = 'DisplayErrorBotMissingPermissions';
}
