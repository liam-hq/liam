import { ShowMode } from "@/schemas";
import { useCallback, useState } from "react";

export const useShowMode = (initialState: ShowMode) => {
  const [showMode, setShowMode] = useState<ShowMode>('TABLE_NAME')

  const handleChangeValue = useCallback((value: ShowMode) => {
    setShowMode(value)
  })
}