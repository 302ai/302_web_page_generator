import { Label } from "./ui/label"
import { IoLanguage } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { selectGlobal, setGlobalState } from "../store/globalSlice"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

export function LanguagePopover() {
  const dispatch = useAppDispatch()
  const global = useAppSelector(selectGlobal)
  const { i18n } = useTranslation()
  return (
    <Popover>
      <PopoverTrigger>
        <IoLanguage className="text-[20px] cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="w-full p-1">
        <RadioGroup
          className='px-3 gap-0'
          defaultValue={global.language}
          value={global.language}
          onValueChange={(value: "zh" | "en" | "ja") => {
            i18n.changeLanguage(value)
            localStorage.setItem('lang', value)
            dispatch(setGlobalState({ language: value }))
          }}>
          <div className="flex items-center justify-start hover:text-[#8e47f0] w-full" >
            <RadioGroupItem className="min-w-[15px] max-h-[15px]" value="zh" id="r1" />
            <Label className='leading-[2.7] text-left cursor-pointer ml-3 w-full h-full' htmlFor="r1">中文</Label>
          </div>
          <div className="flex items-center justify-start hover:text-[#8e47f0] w-full" >
            <RadioGroupItem className="min-w-[15px] max-h-[15px]" value="en" id="r2" />
            <Label className='leading-[2.7] text-left cursor-pointer ml-3 w-full h-full' htmlFor="r2">English</Label>
          </div>
          <div className="flex items-center justify-start hover:text-[#8e47f0] w-full" >
            <RadioGroupItem className="min-w-[15px] max-h-[15px]" value="ja" id="r3" />
            <Label className='leading-[2.7] text-left cursor-pointer ml-3 w-full h-full' htmlFor="r3">日本語</Label>
          </div>
        </RadioGroup>
      </PopoverContent>
    </Popover>
  )
}
