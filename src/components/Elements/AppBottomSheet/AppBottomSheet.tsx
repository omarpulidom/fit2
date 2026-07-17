import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { type ReactNode, useCallback, useEffect, useRef } from 'react'
import { useWindowDimensions } from 'react-native'

type AppBottomSheetProps = {
  children: ReactNode
  visible: boolean
  onDismiss: () => void
  maxHeight?: number
}

export function AppBottomSheet({
  children,
  visible,
  onDismiss,
  maxHeight = 0.85,
}: AppBottomSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const { height } = useWindowDimensions()
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    [],
  )

  useEffect(() => {
    if (!visible) return
    const frame = requestAnimationFrame(() => sheetRef.current?.present())
    return () => cancelAnimationFrame(frame)
  }, [
    visible,
  ])

  if (!visible) return null

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      enableDynamicSizing
      maxDynamicContentSize={height * maxHeight}
      enablePanDownToClose
      keyboardBehavior='interactive'
      keyboardBlurBehavior='restore'
      backdropComponent={renderBackdrop}
      onDismiss={onDismiss}
      backgroundStyle={{
        backgroundColor: '#f7f7f5',
      }}
      handleIndicatorStyle={{
        backgroundColor: '#a1a1aa',
      }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}
