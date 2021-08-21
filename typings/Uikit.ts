import { ClassName } from "../functions/classname";
import { MayArray } from "./tools";

export interface Uikit {
  className?: MayArray<ClassName>
  /**
   * usuallly, this props is for replace the hole className for custimized style
   */
  forceClassName?: MayArray<ClassName>
}
