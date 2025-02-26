import { selectTableLogEvent } from "@/features/gtm/utils";
import { useVersion } from "@/providers";
import { SidebarMenuButton, SidebarMenuItem, Table2 } from "@liam-hq/ui";
import clsx from "clsx";
import { useRef, useState, type FC, useEffect } from "react";
import { type TableNodeType, useTableSelection } from "../../ERDContent";
import styles from "./TableNameMenuButton.module.css";
import { VisibilityButton } from "./VisibilityButton";
import {
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "@liam-hq/ui";

type Props = {
  node: TableNodeType;
};

export const TableNameMenuButton: FC<Props> = ({ node }) => {
  const name = node.data.table.name;

  const { selectTable } = useTableSelection();
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (textRef.current) {
      setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [name]);

  // TODO: Move handleClickMenuButton outside of TableNameMenuButton
  // after logging is complete
  const { version } = useVersion();
  const handleClickMenuButton = (tableId: string) => () => {
    selectTable({
      tableId,
      displayArea: "main",
    });

    selectTableLogEvent({
      ref: "leftPane",
      tableId,
      platform: version.displayedOn,
      gitHash: version.gitHash,
      ver: version.version,
      appEnv: version.envName,
    });
  };

  return (
    <TooltipProvider>
      <TooltipRoot>
        <SidebarMenuItem>
          <SidebarMenuButton
            className={clsx(
              styles.button,
              node.data.isActiveHighlighted && styles.active
            )}
            asChild
          >
            <div
              // biome-ignore lint/a11y/useSemanticElements: Implemented with div button to be button in button
              role="button"
              tabIndex={0}
              onClick={handleClickMenuButton(name)}
              onKeyDown={handleClickMenuButton(name)}
              aria-label={`Menu button for ${name}`}
            >
              <Table2 size="10px" />
              {isTruncated ? (
                <TooltipTrigger asChild>
                  <span ref={textRef} className={styles.tableName}>
                    {name}
                  </span>
                </TooltipTrigger>
              ) : (
                <span ref={textRef} className={styles.tableName}>
                  {name}
                </span>
              )}

              <VisibilityButton tableName={name} hidden={node.hidden} />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {isTruncated && (
          <TooltipPortal>
            <TooltipContent>{name}</TooltipContent>
          </TooltipPortal>
        )}
      </TooltipRoot>
    </TooltipProvider>
  );
};
