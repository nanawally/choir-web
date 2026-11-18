import type { ReactNode } from "react";
import { Table, Thead, TheadRow, Th, Tbody, Tr, Td } from "../StyledTable";
import { Star } from "lucide-react";
import { useTranslation } from "../../lib/LanguageContext";
import type { Chorist, VoiceGroup, VoicePart } from "../../hooks/useChorists";

type Props = {
  chorists: Chorist[];
  fourPartGroup: VoiceGroup | null | undefined;
  otherStandardGroups: VoiceGroup[];
  getPartForChorist: (choristId: string, group: VoiceGroup) => VoicePart | null | undefined;
  onRowClick?: (chorist: Chorist) => void;
  showSectionLeader?: boolean;
  alternateRows?: boolean;
  actionColumn?: (chorist: Chorist) => ReactNode;
};

export default function ChoristTable({
  chorists,
  fourPartGroup,
  otherStandardGroups,
  getPartForChorist,
  onRowClick,
  showSectionLeader = false,
  alternateRows = false,
  actionColumn,
}: Props) {
  const { t } = useTranslation();

  return (
    <Table className="min-w-150">
      <Thead>
        <TheadRow>
          {fourPartGroup && (
            <Th className="sticky left-0 z-10 w-[min(12vw,3rem)] whitespace-nowrap bg-surface-alt-solid" />
          )}
          <Th className={`sticky z-10 bg-surface-alt-solid ${fourPartGroup ? "left-[min(12vw,3rem)]" : "left-0"}`}>
            {t("common.name")}
          </Th>
          {otherStandardGroups.map((g) => (
            <Th key={g.id}>{g.name}</Th>
          ))}
          {actionColumn && <Th compact />}
        </TheadRow>
      </Thead>
      <Tbody>
        {chorists.map((chorist) => {
          const fourPartPart = fourPartGroup
            ? getPartForChorist(chorist.id, fourPartGroup)
            : null;

          const fourPartIndex = fourPartGroup
            ? fourPartGroup.parts.findIndex((p) => p.id === fourPartPart?.id)
            : -1;
          const isAltRow = alternateRows && fourPartIndex % 2 === 1;
          const stickyBg = isAltRow
            ? "bg-surface-alt-solid group-hover:bg-hover-bg"
            : "bg-background group-hover:bg-hover-bg";

          return (
            <Tr
              key={chorist.id}
              className={`${onRowClick ? "cursor-pointer" : ""} ${isAltRow ? "bg-surface-alt" : ""}`}
              onClick={onRowClick ? () => onRowClick(chorist) : undefined}
            >
              {fourPartGroup && (
                <Td className={`sticky left-0 z-10 w-[min(12vw,3rem)] whitespace-nowrap ${stickyBg}`}>
                  <div className="flex items-center gap-1">
                    <span className="text-muted">
                      {fourPartPart?.name ?? "—"}
                    </span>
                    {showSectionLeader && chorist.isSectionLeader && (
                      <span title={t("chorists.sectionLeaderTooltip")}>
                        <Star
                          size={14}
                          className="text-yellow-500 fill-yellow-500"
                        />
                      </span>
                    )}
                  </div>
                </Td>
              )}
              <Td className={`sticky z-10 font-medium max-w-[min(38vw,12rem)] truncate ${fourPartGroup ? "left-[min(12vw,3rem)]" : "left-0"} ${stickyBg}`}>
                {chorist.firstName} {chorist.lastName}
              </Td>
              {otherStandardGroups.map((group) => {
                const part = getPartForChorist(chorist.id, group);
                return (
                  <Td key={group.id} className="text-muted">
                    {part?.name ?? "—"}
                  </Td>
                );
              })}
              {actionColumn && actionColumn(chorist)}
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
}
