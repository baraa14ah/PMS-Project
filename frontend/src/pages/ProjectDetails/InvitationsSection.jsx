import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Alert,
  Chip,
  Autocomplete,
  TextField,
  Divider,
  InputAdornment,
} from "@mui/material";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { btnPrimarySx, sectionPaperSx } from "../../styles/dashboardUi";

function filterByQuery(options, inputValue) {
  const q = String(inputValue || "").trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      String(u.student_number || "").includes(q),
  );
}

export default function InvitationsSection({
  projectId,
  project,
  canInviteSupervisor,
  canManageProject,
}) {
  const { t } = useLanguage();
  const { authHeaders, apiFetch, API_BASE_URL } = useAuth();

  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [supervisorInput, setSupervisorInput] = useState("");
  const [invitingSupervisor, setInvitingSupervisor] = useState(false);
  const [inviteSupervisorMsg, setInviteSupervisorMsg] = useState("");

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentInput, setStudentInput] = useState("");
  const [inviteStudentMsg, setInviteStudentMsg] = useState("");
  const [invitingStudent, setInvitingStudent] = useState(false);
  const [studentsLoadMsg, setStudentsLoadMsg] = useState("");

  const fetchSupervisors = useCallback(
    async (search = "") => {
      try {
        const qs = new URLSearchParams({ project_id: String(projectId) });
        if (search.trim()) qs.set("search", search.trim());
        const { res, data } = await apiFetch(
          `${API_BASE_URL}/supervisors?${qs.toString()}`,
          { headers: authHeaders() },
        );
        if (res.ok) setSupervisors(data?.supervisors || []);
      } catch {
        setSupervisors([]);
      }
    },
    [API_BASE_URL, apiFetch, authHeaders, projectId],
  );

  const fetchStudentsForInvite = useCallback(
    async (search = "", showLoading = false) => {
      if (showLoading) setStudentsLoadMsg(t("common.loading"));
      try {
        const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
        const { res, data } = await apiFetch(
          `${API_BASE_URL}/project/${projectId}/students${qs}`,
          { headers: authHeaders() },
        );

        if (!res.ok) {
          setStudents([]);
          setStudentsLoadMsg(data?.message || t("projects.loadError"));
          return;
        }

        const list = Array.isArray(data?.students) ? data.students : [];
        setStudents(list);
        setStudentsLoadMsg(
          list.length === 0
            ? t("projects.noStudentsToInvite")
            : `${t("projects.studentsLoaded")}: ${list.length}`,
        );
      } catch {
        setStudents([]);
        setStudentsLoadMsg(t("projects.loadError"));
      }
    },
    [API_BASE_URL, apiFetch, authHeaders, projectId, t],
  );

  const supervisorsLoaded = useRef(false);
  const studentsLoaded = useRef(false);

  useEffect(() => {
    supervisorsLoaded.current = false;
    studentsLoaded.current = false;
  }, [projectId]);

  useEffect(() => {
    if (!canInviteSupervisor) return undefined;
    const delay = supervisorsLoaded.current ? 400 : 0;
    const id = setTimeout(() => {
      fetchSupervisors(supervisorInput);
      supervisorsLoaded.current = true;
    }, delay);
    return () => clearTimeout(id);
  }, [supervisorInput, canInviteSupervisor, projectId, fetchSupervisors]);

  useEffect(() => {
    if (!canManageProject) return undefined;
    const delay = studentsLoaded.current ? 400 : 0;
    const id = setTimeout(() => {
      fetchStudentsForInvite(studentInput, !studentsLoaded.current);
      studentsLoaded.current = true;
    }, delay);
    return () => clearTimeout(id);
  }, [studentInput, canManageProject, projectId, fetchStudentsForInvite]);

  const optionLabel = (u) => {
    const parts = [u.name, u.email].filter(Boolean);
    if (u.student_number) parts.push(`#${u.student_number}`);
    return parts.join(" — ");
  };

  const autocompleteCommon = useMemo(
    () => ({
      openOnFocus: true,
      clearOnBlur: false,
      handleHomeEndKeys: true,
      filterOptions: (opts, state) => filterByQuery(opts, state.inputValue),
      noOptionsText: t("projects.noInviteMatch"),
    }),
    [t],
  );

  const handleSendSupervisorInvite = async () => {
    setInviteSupervisorMsg("");
    if (!selectedSupervisor?.id) {
      setInviteSupervisorMsg(t("projects.selectSupervisor"));
      return;
    }
    try {
      setInvitingSupervisor(true);
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/project/${projectId}/invite-supervisor`,
        {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ supervisor_id: Number(selectedSupervisor.id) }),
        },
      );
      if (!res.ok) {
        setInviteSupervisorMsg(data?.message || t("common.error"));
        return;
      }
      setInviteSupervisorMsg(t("projects.inviteSent"));
      setSelectedSupervisor(null);
      setSupervisorInput("");
    } catch {
      setInviteSupervisorMsg(t("common.error"));
    } finally {
      setInvitingSupervisor(false);
    }
  };

  const handleInviteStudent = async () => {
    setInviteStudentMsg("");
    if (!selectedStudent?.id) {
      setInviteStudentMsg(t("projects.selectStudent"));
      return;
    }
    try {
      setInvitingStudent(true);
      const { res, data } = await apiFetch(
        `${API_BASE_URL}/project/${projectId}/invite-student`,
        {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ student_id: Number(selectedStudent.id) }),
        },
      );
      if (!res.ok) {
        setInviteStudentMsg(data?.message || t("common.error"));
        return;
      }
      setInviteStudentMsg(t("projects.inviteSent"));
      setStudents((prev) => prev.filter((s) => s.id !== selectedStudent.id));
      setSelectedStudent(null);
      setStudentInput("");
    } catch {
      setInviteStudentMsg(t("common.error"));
    } finally {
      setInvitingStudent(false);
    }
  };

  if (!canInviteSupervisor && !canManageProject) return null;

  return (
    <Paper elevation={0} sx={{ ...sectionPaperSx, mt: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
        <PersonAddAltRoundedIcon color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 900, flex: 1, color: "text.primary" }}>
          {t("projects.invitesTitle")}
        </Typography>
        <Chip
          size="small"
          icon={<SchoolRoundedIcon />}
          label={t("projects.sameUniversityOnly")}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
        {canInviteSupervisor && (
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <SupervisorAccountRoundedIcon fontSize="small" color="info" />
              <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary" }}>
                {t("projects.inviteSupervisor")}
              </Typography>
            </Stack>
            {project?.supervisor_id ? (
              <Alert severity="info">{t("projects.supervisorAssigned")}</Alert>
            ) : (
              <>
                {inviteSupervisorMsg && (
                  <Alert
                    sx={{ mb: 1 }}
                    severity={
                      inviteSupervisorMsg === t("projects.inviteSent") ? "success" : "warning"
                    }
                  >
                    {inviteSupervisorMsg}
                  </Alert>
                )}
                <Stack spacing={1}>
                  <Autocomplete
                    {...autocompleteCommon}
                    options={supervisors}
                    value={selectedSupervisor}
                    inputValue={supervisorInput}
                    onInputChange={(_, v) => setSupervisorInput(v)}
                    onChange={(_, v) => setSelectedSupervisor(v)}
                    getOptionLabel={optionLabel}
                    isOptionEqualToValue={(a, b) => a?.id === b?.id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        label={t("projects.selectSupervisor")}
                        placeholder={t("projects.searchInvite")}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <SearchRoundedIcon fontSize="small" color="action" />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSendSupervisorInvite}
                    disabled={invitingSupervisor || !selectedSupervisor}
                    sx={{ ...btnPrimarySx, borderRadius: 2 }}
                  >
                    {invitingSupervisor ? t("common.loading") : t("projects.sendInvite")}
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        )}

        {canInviteSupervisor && canManageProject && (
          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />
        )}

        {canManageProject && (
          <Box sx={{ flex: 1 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary" }}>
                {t("projects.inviteStudent")}
              </Typography>
              <Button size="small" variant="outlined" onClick={() => fetchStudentsForInvite(studentInput)}>
                {t("projects.refreshList")}
              </Button>
            </Stack>

            {inviteStudentMsg && (
              <Alert
                sx={{ mb: 1 }}
                severity={inviteStudentMsg === t("projects.inviteSent") ? "success" : "info"}
              >
                {inviteStudentMsg}
              </Alert>
            )}

            <Stack spacing={1}>
              <Autocomplete
                {...autocompleteCommon}
                options={students}
                value={selectedStudent}
                inputValue={studentInput}
                onInputChange={(_, v) => setStudentInput(v)}
                onChange={(_, v) => setSelectedStudent(v)}
                getOptionLabel={optionLabel}
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label={t("projects.selectStudent")}
                    placeholder={t("projects.searchInvite")}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <SearchRoundedIcon fontSize="small" color="action" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <Button
                variant="contained"
                color="success"
                onClick={handleInviteStudent}
                disabled={invitingStudent || !selectedStudent}
                sx={{ fontWeight: 800, borderRadius: 2, color: "#fff" }}
              >
                {invitingStudent ? t("common.loading") : t("projects.sendInvite")}
              </Button>
            </Stack>

            {studentsLoadMsg && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                {studentsLoadMsg}
              </Typography>
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
