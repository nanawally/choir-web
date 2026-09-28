"use client";

import ChoristModal from "../../components/ChoristModal";
import { Table, Thead, TheadRow, Th, Tbody, Tr, Td } from "../../components/StyledTable";
import NavSidebar from "../../components/NavSidebar";
import { useChorists } from "../../hooks/useChorists";
import { useTranslation } from "../../lib/LanguageContext";
import { EllipsisVertical, ChevronDown, ChevronRight, Download, X, Star, SquarePen } from "lucide-react";

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
      <div className="flex-1 flex flex-col py-8 px-8">
      <h1 className="text-4xl font-bold mb-6 text-center">{t("chorists.title")}</h1>

      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("chorists.searchByName")}
              className="border border-gray-300 rounded px-3 py-2 text-sm w-64"
            />
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => {
                  setFilterMenuOpen(!filterMenuOpen);
                  setFilterExpandedGroup(null);
                }}
                className="px-2 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                title="Filter"
              >
                <EllipsisVertical size={16} />
              </button>
              {filterMenuOpen && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-56">
                  {sortedFilterGroups.map((group) => (
                    <div key={group.id}>
                      <button
                        onClick={() =>
                          setFilterExpandedGroup(
                            filterExpandedGroup === group.id ? null : group.id,
                          )
                        }
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span>{group.name}</span>
                        <span className="text-gray-400 text-xs">
                          {filterExpandedGroup === group.id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </span>
                      </button>
                      {filterExpandedGroup === group.id && (
                        <div className="pl-3 pb-1">
                          {group.parts.map((part) => (
                            <label
                              key={part.id}
                              className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-50 cursor-pointer"
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
              className="px-2 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              title="Download CSV"
            >
              <Download size={16} />
            </button>
            <button
              onClick={openArchivedModal}
              className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
            >
              {t("chorists.archived")}
            </button>
            <button
              onClick={() => setModal({ mode: "add" })}
              className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium"
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
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
              >
                {f.groupName}: {f.partName}
                <button
                  onClick={() => removeFilter(f.groupId, f.partId)}
                  className="hover:text-blue-600"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {t("common.clearAll")}
            </button>
          </div>
        )}

        <Table>
          <Thead>
            <TheadRow>
              {fourPartGroup && <Th compact />}
              <Th>{t("common.name")}</Th>
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

              return (
                <Tr key={chorist.id}>
                  {fourPartGroup && (
                    <Td compact>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">
                          {fourPartPart?.name ?? "—"}
                        </span>
                        {chorist.isSectionLeader && (
                          <span title="Section leader"><Star size={14} className="text-yellow-500 fill-yellow-500" /></span>
                        )}
                      </div>
                    </Td>
                  )}
                  <Td className="font-medium">{chorist.firstName} {chorist.lastName}</Td>
                  {otherStandardGroups.map((group) => {
                    const part = getPartForChorist(chorist.id, group);
                    return (
                      <Td key={group.id} className="text-gray-600">
                        {part?.name ?? "—"}
                      </Td>
                    );
                  })}
                  <Td compact className="text-center">
                    <button
                      onClick={() => setModal({ mode: "edit", chorist })}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit chorist"
                    >
                      <SquarePen size={16} />
                    </button>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>

        {!loading && filteredChorists.length === 0 && (
          <p className="text-gray-400 text-sm mt-4 text-center">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{t("chorists.archived")}</h2>
              <button
                onClick={() => setArchivedOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {archivedChorists.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                {t("chorists.noArchived")}
              </p>
            ) : (
              <Table>
                <Thead>
                  <TheadRow>
                    {fourPartGroup && <Th compact />}
                    <Th>{t("common.name")}</Th>
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
                          <Td compact>
                            <span className="text-gray-600">
                              {fourPartPart?.name ?? "—"}
                            </span>
                          </Td>
                        )}
                        <Td className="font-medium">{chorist.firstName} {chorist.lastName}</Td>
                        {otherStandardGroups.map((group) => {
                          const part = getPartForChorist(chorist.id, group);
                          return (
                            <Td key={group.id} className="text-gray-600">
                              {part?.name ?? "—"}
                            </Td>
                          );
                        })}
                        <Td compact className="text-center">
                          <button
                            onClick={() => handleUnarchive(chorist.id)}
                            className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                          >
                            {t("chorists.unarchive")}
                          </button>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
