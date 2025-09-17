import type { PlayModeOption, PlayMode } from '~/types/audio'
import { PlayMode as PlayModeEnum } from '~/types/audio'

/**
 * 播放模式 composable
 * 提供本地化的播放模式选项和相关工具函数
 */
export const usePlayModes = () => {
  const { t } = useI18n()

  /**
   * 获取本地化的播放模式选项
   */
  const playModeOptions = computed((): PlayModeOption[] => [
    {
      value: PlayModeEnum.SINGLE,
      label: t('playModes.single.label'),
      icon: 'i-lucide-repeat-1',
      description: t('playModes.single.description')
    },
    {
      value: PlayModeEnum.SEQUENTIAL,
      label: t('playModes.sequential.label'),
      icon: 'i-lucide-list',
      description: t('playModes.sequential.description')
    },
    {
      value: PlayModeEnum.LOOP,
      label: t('playModes.loop.label'),
      icon: 'i-lucide-repeat',
      description: t('playModes.loop.description')
    },
    {
      value: PlayModeEnum.RANDOM,
      label: t('playModes.random.label'),
      icon: 'i-lucide-shuffle',
      description: t('playModes.random.description')
    }
  ])

  /**
   * 根据播放模式值获取对应的选项信息
   */
  const getPlayModeInfo = (mode: PlayMode) => {
    return playModeOptions.value.find(option => option.value === mode)
  }

  /**
   * 获取播放模式的图标
   */
  const getPlayModeIcon = (mode?: PlayMode) => {
    const defaultIcon = 'i-lucide-list'
    return mode ? getPlayModeInfo(mode)?.icon || defaultIcon : defaultIcon
  }

  /**
   * 获取播放模式的标签
   */
  const getPlayModeLabel = (mode?: PlayMode) => {
    const defaultLabel = t('playModes.sequential.label')
    return mode ? getPlayModeInfo(mode)?.label || defaultLabel : defaultLabel
  }

  /**
   * 获取播放模式的描述
   */
  const getPlayModeDescription = (mode?: PlayMode) => {
    const defaultDescription = t('playModes.sequential.description')
    return mode ? getPlayModeInfo(mode)?.description || defaultDescription : defaultDescription
  }

  return {
    playModeOptions,
    getPlayModeInfo,
    getPlayModeIcon,
    getPlayModeLabel,
    getPlayModeDescription,
  }
}
