import { ButtonInteraction } from "discord.js";
import { Discord } from "discordx";
import { languages } from "i18n/instance";
import { ButtonComponents } from "utils/discordx/dynamic";

@Discord()
export class OpenButton {
  @ButtonComponents(languages)
  public async handleticketbutton (interaction: ButtonInteraction): Promise<void> {
    
  }
}
