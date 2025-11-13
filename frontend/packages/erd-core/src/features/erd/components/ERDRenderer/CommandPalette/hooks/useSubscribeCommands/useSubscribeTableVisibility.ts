import { useEffect } from "react";
import { useTableVisibility } from "../../../../../hooks";

export const useSubscribeTableVisibility = () => {
  const { showAllNodes, hideAllNodes } = useTableVisibility()

  // Show all nodes when ⇧A is pressed
  useEffect(() => {
    const down = async (event: KeyboardEvent) => {
      if (event.code === 'KeyA' && event.shiftKey) {
        showAllNodes()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [showAllNodes])


  // Hide all nodes when ⇧H is pressed
  useEffect(() => {
    const down = async (event: KeyboardEvent) => {
      if (event.code === 'KeyH' && event.shiftKey) {
        hideAllNodes()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [hideAllNodes])
};