import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel,
  Slider,
  Tooltip,
  Chip
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PublicIcon from '@mui/icons-material/Public'
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial'
import { useSettings } from '../context/SettingsContext'
import { AutoSaveMode, ProjectSettings } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  /** If provided, show per-project override section */
  hasProject?: boolean
}

export default function SettingsPanel({ open, onClose, hasProject }: Props) {
  const { globalSettings, projectSettings, resolved, updateGlobal, updateProject } = useSettings()

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const projOverride = (key: keyof ProjectSettings): boolean => {
    if (!projectSettings) return false
    if (key === 'autoSave') return projectSettings.autoSave != null
    if (key === 'prefillNames') return projectSettings.prefillNames != null
    return false
  }

  const clearProjOverride = (key: keyof ProjectSettings) => {
    if (!projectSettings) return
    const next = { ...projectSettings }
    if (key === 'autoSave') next.autoSave = null
    if (key === 'prefillNames') next.prefillNames = null
    updateProject(next)
  }

  const setProjOverride = (patch: ProjectSettings) => {
    updateProject({ ...projectSettings, ...patch })
  }

  // Effective values (resolved)
  // const autoSaveMode = resolved.autoSave.mode
  // const intervalSec = resolved.autoSave.intervalSeconds
  const prefillNames = resolved.prefillNames

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 380,
          background: '#13161f',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          p: 0
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2.5,
          py: 2,
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <Typography variant="h6" sx={{ flex: 1, fontSize: '1rem' }}>
          Settings
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ overflow: 'auto', flex: 1 }}>
        {/* ── Global settings ── */}
        <SectionHeader icon={<PublicIcon fontSize="small" />} label="Global" />

        <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <AutoSaveSetting
            mode={globalSettings.autoSave.mode}
            intervalSec={globalSettings.autoSave.intervalSeconds}
            onModeChange={(mode) =>
              updateGlobal({ autoSave: { ...globalSettings.autoSave, mode } })
            }
            onIntervalChange={(s) =>
              updateGlobal({ autoSave: { ...globalSettings.autoSave, intervalSeconds: s } })
            }
          />

          <PrefillSetting
            value={globalSettings.prefillNames}
            onChange={(v) => updateGlobal({ prefillNames: v })}
          />
        </Box>

        {/* ── Per-project overrides ── */}
        {hasProject && (
          <>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />
            <SectionHeader
              icon={<FolderSpecialIcon fontSize="small" />}
              label="This project"
              subtitle="Overrides global settings for this project only"
            />

            <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Auto-save override */}
              <OverrideRow
                label="Auto-save"
                active={projOverride('autoSave')}
                effectiveLabel={autoSaveModeLabel(resolved.autoSave.mode)}
                onEnable={() =>
                  setProjOverride({
                    autoSave: {
                      mode: globalSettings.autoSave.mode,
                      intervalSeconds: globalSettings.autoSave.intervalSeconds
                    }
                  })
                }
                onDisable={() => clearProjOverride('autoSave')}
              >
                {projOverride('autoSave') && (
                  <AutoSaveSetting
                    mode={projectSettings?.autoSave?.mode ?? globalSettings.autoSave.mode}
                    intervalSec={
                      projectSettings?.autoSave?.intervalSeconds ??
                      globalSettings.autoSave.intervalSeconds
                    }
                    onModeChange={(mode) =>
                      setProjOverride({
                        autoSave: {
                          mode,
                          intervalSeconds:
                            projectSettings?.autoSave?.intervalSeconds ??
                            globalSettings.autoSave.intervalSeconds
                        }
                      })
                    }
                    onIntervalChange={(s) =>
                      setProjOverride({
                        autoSave: {
                          mode: projectSettings?.autoSave?.mode ?? globalSettings.autoSave.mode,
                          intervalSeconds: s
                        }
                      })
                    }
                  />
                )}
              </OverrideRow>

              {/* Prefill names override */}
              <OverrideRow
                label="Prefill names"
                active={projOverride('prefillNames')}
                effectiveLabel={prefillNames ? 'On' : 'Off'}
                onEnable={() => setProjOverride({ prefillNames: globalSettings.prefillNames })}
                onDisable={() => clearProjOverride('prefillNames')}
              >
                {projOverride('prefillNames') && (
                  <PrefillSetting
                    value={projectSettings?.prefillNames ?? globalSettings.prefillNames}
                    onChange={(v) => setProjOverride({ prefillNames: v })}
                  />
                )}
              </OverrideRow>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
  subtitle
}: {
  icon: React.ReactNode
  label: string
  subtitle?: string
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2.5,
        pt: 2.5,
        pb: 0.5
      }}
    >
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Box>
        <Typography
          variant="overline"
          sx={{ letterSpacing: 2, fontSize: '0.65rem', color: 'primary.main', lineHeight: 1.2 }}
        >
          {label}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ display: 'block', fontSize: '0.7rem' }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

function OverrideRow({
  label,
  active,
  effectiveLabel,
  onEnable,
  onDisable,
  children
}: {
  label: string
  active: boolean
  effectiveLabel: string
  onEnable: () => void
  onDisable: () => void
  children?: React.ReactNode
}) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: active ? 1.5 : 0 }}>
        <Typography variant="body2" sx={{ flex: 1, color: 'text.secondary' }}>
          {label}
        </Typography>
        {!active && (
          <Tooltip title="Using global value">
            <Chip
              label={`Global · ${effectiveLabel}`}
              size="small"
              sx={{ height: 18, fontSize: '0.65rem', cursor: 'default' }}
            />
          </Tooltip>
        )}
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={active}
              onChange={(_, checked) => (checked ? onEnable() : onDisable())}
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              Override
            </Typography>
          }
          labelPlacement="start"
          sx={{ m: 0, gap: 0.5 }}
        />
      </Box>
      {children}
    </Box>
  )
}

function AutoSaveSetting({
  mode,
  intervalSec,
  onModeChange,
  onIntervalChange
}: {
  mode: AutoSaveMode
  intervalSec: number
  onModeChange: (m: AutoSaveMode) => void
  onIntervalChange: (s: number) => void
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        Auto-save
      </Typography>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, v) => v && onModeChange(v as AutoSaveMode)}
        size="small"
        sx={{
          '& .MuiToggleButton-root': {
            py: 0.5,
            px: 1.5,
            fontSize: '0.75rem',
            textTransform: 'none'
          }
        }}
      >
        <ToggleButton value="off">Off</ToggleButton>
        <ToggleButton value="on-edit">On edit</ToggleButton>
        <ToggleButton value="interval">Every N seconds</ToggleButton>
      </ToggleButtonGroup>

      {mode === 'interval' && (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Interval: {intervalSec}s
          </Typography>
          <Slider
            min={5}
            max={300}
            step={5}
            value={intervalSec}
            onChange={(_, v) => onIntervalChange(v as number)}
            marks={[
              { value: 5, label: '5s' },
              { value: 60, label: '60s' },
              { value: 300, label: '5m' }
            ]}
            sx={{ mt: 1 }}
          />
        </Box>
      )}
    </Box>
  )
}

function PrefillSetting({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <FormControlLabel
      control={<Switch size="small" checked={value} onChange={(_, checked) => onChange(checked)} />}
      label={
        <Box>
          <Typography variant="body2">Prefill names</Typography>
          <Typography variant="caption" color="text.secondary">
            New groups/items get a default name like "Group 1"
          </Typography>
        </Box>
      }
      sx={{ alignItems: 'flex-start', mx: 0, gap: 1 }}
    />
  )
}

function autoSaveModeLabel(mode: AutoSaveMode): string {
  if (mode === 'off') return 'Off'
  if (mode === 'on-edit') return 'On edit'
  return 'Interval'
}
