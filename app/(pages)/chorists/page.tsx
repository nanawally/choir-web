"use client";

import ChoristModal from "../../components/chorists/ChoristModal";
import {
  Table,
  Thead,
  TheadRow,
  Th,
  Tbody,
  Tr,
  Td,
} from "../../components/StyledTable";
import NavSidebar from "../../components/NavSidebar";
import { useChorists } from "../../hooks/useChorists";
import { useTranslation } from "../../lib/LanguageContext";
import {
  ChevronDown,
  ChevronRight,
  Download,
  X,
  Star,
  SquarePen,
} from "lucide-react";

export default function RosterPage() {
  const { t } = useTranslation();
  const {
    loading,
    search,
    setSearch,
    modal,
    setModal,
    filters,
    filterMenuOpen,
    setFilterMenuOpen,
    filterExpandedGroup,
    setFilterExpandedGroup,
    filterRef,
    archivedOpen,
    setArchivedOpen,
    archivedChorists,
    voiceGroups,
    fourPartGroup,
    otherStandardGroups,
    filteredChorists,
    sortedFilterGroups,
    getPartForChorist,
    getCurrentParts,
    isFilterActive,
    toggleFilter,
    removeFilter,
    clearFilters,
    openArchivedModal,
    handleUnarchive,
    handleDownloadCsv,
    loadData,
  } = useChorists();

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-8 min-w-0">
        <h1 className="text-4xl font-bold mb-6 text-center">
          {t("chorists.title")}
        </h1>

        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("chorists.searchByName")}
                className="border border-border rounded px-3 py-2 text-sm w-full sm:w-64"
              />
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => {
                    setFilterMenuOpen(!filterMenuOpen);
                    setFilterExpandedGroup(null);
                  }}
                  className="px-2 py-2 border border-border rounded text-sm hover:bg-hover-bg"
                  title={t("common.filter")}
                >
                  {t("common.filter")}
                </button>
                {filterMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg z-50 w-56">
                    {sortedFilterGroups.map((group) => (
                      <div key={group.id}>
                        <button
                          onClick={() =>
                            setFilterExpandedGroup(
                              filterExpandedGroup === group.id
                                ? null
                                : group.id,
                            )
                          }
                          className="w-full text-left px-3 py-2 text-sm hover:bg-hover-bg flex items-center justify-between"
                        >
                          <span>{group.name}</span>
                          <span className="text-subtle text-xs">
                            {filterExpandedGroup === group.id ? (
                              <ChevronDown size={12} />
                            ) : (
                              <ChevronRight size={12} />
                            )}
                          </span>
                        </button>
                        {filterExpandedGroup === group.id && (
                          <div className="pl-3 pb-1">
                            {group.parts.map((part) => (
                              <label
                                key={part.id}
                                className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-hover-bg cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isFilterActive(group.id, part.id)}
                                  onChange={() => toggleFilter(group, part)}
                                />
                                {part.name}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadCsv}
                className="px-2 py-2 border border-border rounded text-sm hover:bg-hover-bg"
                title={t("common.downloadCsv")}
              >
                <Download size={16} />
              </button>
              <button
                onClick={openArchivedModal}
                className="px-3 py-2 border border-border rounded text-sm text-muted hover:bg-hover-bg"
              >
                {t("chorists.archived")}
              </button>
              <button
                onClick={() => setModal({ mode: "add" })}
                className="px-3 py-2 btn-primary text-sm font-medium"
              >
                {t("chorists.addChorist")}
              </button>
            </div>
          </div>

          {filters.length > 0 && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {filters.map((f) => (
                <span
                  key={`${f.groupId}-${f.partId}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-light text-primary-light-text rounded text-xs"
                >
                  {f.groupName}: {f.partName}
                  <button
                    onClick={() => removeFilter(f.groupId, f.partId)}
                    className="hover:text-link"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button
                onClick={clearFilters}
                className="text-xs text-muted hover:text-foreground"
              >
                {t("common.clearAll")}
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table className="min-w-150">
              <Thead>
                <TheadRow>
                  {fourPartGroup && (
                    <Th className="sticky left-0 z-10 bg-surface w-[min(12vw,3rem)] whitespace-nowrap" />
                  )}
                  <Th className={`sticky z-10 bg-surface ${fourPartGroup ? "left-[min(12vw,3rem)]" : "left-0"}`}>
                    {t("common.name")}
                  </Th>
                  {otherStandardGroups.map((g) => (
                    <Th key={g.id}>{g.name}</Th>
                  ))}
                  <Th compact />
                </TheadRow>
              </Thead>
              <Tbody>
                {filteredChorists.map((chorist) => {
                  const fourPartPart = fourPartGroup
                    ? getPartForChorist(chorist.id, fourPartGroup)
                    : null;

                  const fourPartIndex = fourPartGroup
                    ? fourPartGroup.parts.findIndex((p) => p.id === fourPartPart?.id)
                    : -1;
                  const isAltRow = fourPartIndex % 2 === 1;
                  const stickyBg = isAltRow
                    ? "bg-surface-alt group-hover:bg-hover-bg"
                    : "bg-surface group-hover:bg-hover-bg";

                  return (
                    <Tr key={chorist.id} className={isAltRow ? "bg-surface-alt" : ""}>
                      {fourPartGroup && (
                        <Td className={`sticky left-0 z-10 w-[min(12vw,3rem)] whitespace-nowrap ${stickyBg}`}>
                          <div className="flex items-center gap-1">
                            <span className="text-muted">
                              {fourPartPart?.name ?? "—"}
                            </span>
                            {chorist.isSectionLeader && (
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
                      <Td compact className="text-center">
                        <button
                          onClick={() => setModal({ mode: "edit", chorist })}
                          className="text-subtle hover:text-muted"
                          title={t("chorists.editTitle")}
                        >
                          <SquarePen size={16} />
                        </button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </div>

          {!loading && filteredChorists.length === 0 && (
            <p className="text-subtle text-sm mt-4 text-center">
              {search ? t("chorists.noMatch") : t("chorists.noChorists")}
            </p>
          )}
        </div>

        {modal.mode !== "closed" && (
          <ChoristModal
            mode={modal.mode}
            chorist={modal.mode === "edit" ? modal.chorist : undefined}
            voiceGroups={voiceGroups}
            currentParts={
              modal.mode === "edit" ? getCurrentParts(modal.chorist.id) : {}
            }
            onClose={() => setModal({ mode: "closed" })}
            onSaved={() => {
              setModal({ mode: "closed" });
              loadData();
            }}
          />
        )}

        {archivedOpen && (
          <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {t("chorists.archived")}
                </h2>
                <button
                  onClick={() => setArchivedOpen(false)}
                  className="text-subtle hover:text-muted"
                >
                  <X size={20} />
                </button>
              </div>

              {archivedChorists.length === 0 ? (
                <p className="text-subtle text-sm text-center py-4">
                  {t("chorists.noArchived")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                <Table className="min-w-150">
                  <Thead>
                    <TheadRow>
                      {fourPartGroup && (
                        <Th className="sticky left-0 z-10 bg-surface w-[min(12vw,3rem)] whitespace-nowrap" />
                      )}
                      <Th className={`sticky z-10 bg-surface ${fourPartGroup ? "left-[min(12vw,3rem)]" : "left-0"}`}>
                        {t("common.name")}
                      </Th>
                      {otherStandardGroups.map((g) => (
                        <Th key={g.id}>{g.name}</Th>
                      ))}
                      <Th compact />
                    </TheadRow>
                  </Thead>
                  <Tbody>
                    {archivedChorists.map((chorist) => {
                      const fourPartPart = fourPartGroup
                        ? getPartForChorist(chorist.id, fourPartGroup)
                        : null;

                      return (
                        <Tr key={chorist.id}>
                          {fourPartGroup && (
                            <Td className="sticky left-0 z-10 w-[min(12vw,3rem)] whitespace-nowrap bg-surface group-hover:bg-hover-bg">
                              <span className="text-muted">
                                {fourPartPart?.name ?? "—"}
                              </span>
                            </Td>
                          )}
                          <Td className={`sticky z-10 font-medium max-w-[min(38vw,12rem)] truncate ${fourPartGroup ? "left-[min(12vw,3rem)]" : "left-0"} bg-surface group-hover:bg-hover-bg`}>
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
                          <Td compact className="text-center">
                            <button
                              onClick={() => handleUnarchive(chorist.id)}
                              className="text-link hover:text-link text-xs font-medium"
                            >
                              {t("chorists.unarchive")}
                            </button>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
