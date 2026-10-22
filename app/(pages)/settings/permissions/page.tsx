"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NavSidebar from "../../../components/NavSidebar";
import { useTranslation } from "../../../lib/LanguageContext";
import { ChevronDown, ChevronLeft, Trash2 } from "lucide-react";
import {
  listPermissionGroups,
  createPermissionGroup,
  deletePermissionGroup,
  setGroupPermission,
  addGroupMember,
  removeGroupMember,
  type PermissionGroup,
  type PermissionEntry,
} from "../../../lib/api";
import { listUsers, type User } from "../../../lib/api";

const ALL_FEATURES = [
  "chorists",
  "chorists_notes",
  "voice_groups",
  "songs",
  "songbooks",
  "songbooks_hidden",
  "concerts",
  "formations",
  "base_formations",
  "permissions",
] as const;

function getPerm(group: PermissionGroup, feature: string): PermissionEntry {
  return (
    group.permissions.find((p) => p.feature === feature) ?? {
      feature,
      canView: false,
      canEdit: false,
      canDelete: false,
    }
  );
}

export default function PermissionsPage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");

  useEffect(() => {
    Promise.all([listPermissionGroups(), listUsers()]).then(([gs, us]) => {
      setGroups(gs);
      setUsers(us);
      setLoading(false);
    });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const group = await createPermissionGroup(newGroupName.trim());
    if (group) {
      setGroups([...groups, group]);
      setExpandedId(group.id);
      setNewGroupName("");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(t("permissions.confirmDeleteGroup").replace("{name}", name))) return;
    if (await deletePermissionGroup(id)) {
      setGroups(groups.filter((g) => g.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  }

  async function handlePermToggle(
    groupId: string,
    feature: string,
    action: "canView" | "canEdit" | "canDelete",
  ) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const current = getPerm(group, feature);
    const updated = { ...current, [action]: !current[action] };

    setGroups(
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              permissions: g.permissions.some((p) => p.feature === feature)
                ? g.permissions.map((p) => (p.feature === feature ? updated : p))
                : [...g.permissions, updated],
            }
          : g,
      ),
    );

    await setGroupPermission(groupId, feature, updated.canView, updated.canEdit, updated.canDelete);
  }

  async function handleAddMember(groupId: string, userId: string) {
    if (!userId) return;
    if (await addGroupMember(groupId, userId)) {
      setGroups(
        groups.map((g) =>
          g.id === groupId ? { ...g, memberIds: [...g.memberIds, userId] } : g,
        ),
      );
    }
  }

  async function handleRemoveMember(groupId: string, userId: string) {
    if (await removeGroupMember(groupId, userId)) {
      setGroups(
        groups.map((g) =>
          g.id === groupId
            ? { ...g, memberIds: g.memberIds.filter((id) => id !== userId) }
            : g,
        ),
      );
    }
  }

  function featureLabel(feature: string): string {
    const map: Record<string, string> = {
      chorists: t("permissions.feature.chorists"),
      chorists_notes: t("permissions.feature.choristsNotes"),
      voice_groups: t("permissions.feature.voiceGroups"),
      songs: t("permissions.feature.songs"),
      songbooks: t("permissions.feature.songbooks"),
      songbooks_hidden: t("permissions.feature.songbooksHidden"),
      concerts: t("permissions.feature.concerts"),
      formations: t("permissions.feature.formations"),
      base_formations: t("permissions.feature.baseFormations"),
      permissions: t("permissions.feature.permissions"),
    };
    return map[feature] ?? feature;
  }

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-[5.56vw]">
        <Link href="/settings" className="flex items-center gap-1 text-sm text-muted hover:text-text mb-4 w-fit">
          <ChevronLeft size={16} />{t("settings.title")}
        </Link>
        <h1 className="text-4xl font-bold mb-6 text-center">{t("settings.permissionsTitle")}</h1>

        <form onSubmit={handleCreate} className="flex gap-2 mb-6 max-w-2xl mx-auto w-full">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder={t("permissions.groupName")}
            className="flex-1 border border-border rounded px-3 py-2 text-sm bg-surface"
          />
          <button type="submit" className="px-4 py-2 btn-primary text-sm font-medium whitespace-nowrap">
            {t("permissions.newGroup")}
          </button>
        </form>

        {loading ? (
          <p className="text-muted text-center">{t("common.loading")}</p>
        ) : groups.length === 0 ? (
          <p className="text-muted text-center">{t("permissions.noGroups")}</p>
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto w-full">
            {groups.map((group) => {
              const isExpanded = expandedId === group.id;
              const nonMembers = users.filter((u) => !group.memberIds.includes(u.id));

              return (
                <div key={group.id} className="border border-border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center gap-2 p-3 cursor-pointer hover:bg-hover-bg select-none"
                    onClick={() => setExpandedId(isExpanded ? null : group.id)}
                  >
                    <span className="font-medium flex-1">{group.name}</span>
                    {group.isAdmin && (
                      <span className="text-xs text-muted px-1.5 py-0.5 rounded bg-surface-alt border border-border">
                        Admin
                      </span>
                    )}
                    <span className="text-xs text-muted">
                      {group.memberIds.length} {t("permissions.members").toLowerCase()}
                    </span>
                    {!group.isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(group.id, group.name);
                        }}
                        className="p-1 text-danger hover:bg-hover-bg rounded"
                        title={t("common.delete")}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <ChevronDown
                      size={16}
                      className={`text-muted transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-5">
                      {/* Permission matrix */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-1.5 pr-4 font-medium text-muted">Feature</th>
                              <th className="text-center py-1.5 px-3 font-medium text-muted">
                                {t("permissions.canView")}
                              </th>
                              <th className="text-center py-1.5 px-3 font-medium text-muted">
                                {t("permissions.canEdit")}
                              </th>
                              <th className="text-center py-1.5 px-3 font-medium text-muted">
                                {t("permissions.canDelete")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {ALL_FEATURES.map((feature) => {
                              const perm = getPerm(group, feature);
                              return (
                                <tr key={feature} className="border-b border-border last:border-0">
                                  <td className="py-1.5 pr-4">{featureLabel(feature)}</td>
                                  {(["canView", "canEdit", "canDelete"] as const).map((action) => (
                                    <td key={action} className="text-center py-1.5 px-3">
                                      <input
                                        type="checkbox"
                                        checked={perm[action]}
                                        onChange={() => handlePermToggle(group.id, feature, action)}
                                        className="cursor-pointer w-4 h-4"
                                      />
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Members */}
                      <div>
                        <h3 className="text-sm font-semibold mb-2">{t("permissions.members")}</h3>
                        {group.memberIds.length === 0 ? (
                          <p className="text-xs text-muted mb-2">{t("permissions.noMembers")}</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {group.memberIds.map((uid) => {
                              const user = users.find((u) => u.id === uid);
                              return (
                                <span
                                  key={uid}
                                  className="flex items-center gap-1 text-xs border border-border rounded-full px-2.5 py-0.5 bg-surface"
                                >
                                  <span className="font-mono">{user?.username ?? uid}</span>
                                  <button
                                    onClick={() => handleRemoveMember(group.id, uid)}
                                    className="text-muted hover:text-danger leading-none"
                                    title={t("common.delete")}
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {nonMembers.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) handleAddMember(group.id, e.target.value);
                            }}
                            className="border border-border rounded px-2 py-1 bg-surface text-sm"
                          >
                            <option value="">{t("permissions.addMember")}</option>
                            {nonMembers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.username}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
