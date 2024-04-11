/* eslint-disable simple-import-sort/imports */
import clsx from 'clsx'
import {
  ComponentProps,
  ElementRef,
  Ref,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
// Somehow build does not see .d.ts file for this library
// @ts-ignore
import type { ChildrenComponentProps } from 'react-input-position-v2'
// @ts-ignore
import ReactInputPosition, { MOUSE_ACTIVATION, TOUCH_ACTIVATION } from 'react-input-position-v2'

import { PayloadImage } from '../PayloadImage'
import ShopifyImage from '../ShopifyImage'

type MediaRendererHandle = {
  getZoomComponentSizes: () => void
}

type MediaComponents = typeof PayloadImage | typeof ShopifyImage

type MediaMagnifierProps<T extends MediaComponents> = {
  Component: T
  componentProps: ComponentProps<T>
  zoom?: number
  mouseActivationMethod: MOUSE_ACTIVATION
  touchActivationMethod: TOUCH_ACTIVATION
  onActivate?: () => void
  onDeactivate?: () => void
}

export default function MediaMagnifier<T extends MediaComponents>(props: MediaMagnifierProps<T>) {
  const mediaRendererRef = useRef<MediaRendererHandle>()

  return (
    <div className='isolate w-full'>
      <ReactInputPosition
        mouseActivationMethod={props.mouseActivationMethod}
        touchActivationMethod={props.touchActivationMethod}
        itemPositionLimitBySize
        trackItemPosition
        className='relative overflow-hidden'
        onActivate={() => {
          props.onActivate && props.onActivate()
          mediaRendererRef.current?.getZoomComponentSizes()
        }}
        onDeactivate={props.onDeactivate}
      >
        {/* @ts-ignore */}
        <MediaRenderer {...props} handlerRef={mediaRendererRef} />
      </ReactInputPosition>
    </div>
  )
}

function MediaRenderer<T extends MediaComponents>({
  active,
  activePosition,
  Component,
  componentProps,
  itemPosition,
  zoom = 0.5,
  handlerRef,
}: ChildrenComponentProps &
  MediaMagnifierProps<T> & {
    handlerRef: Ref<MediaRendererHandle>
  }) {
  const [mediaSize, setMediaSize] = useState({ width: 0, height: 0 })

  const renderElementRef = useRef<ElementRef<'div'>>(null)

  const getZoomComponentSizes = useCallback(() => {
    if (!renderElementRef.current) return

    const element = renderElementRef.current

    setMediaSize({
      width: element.offsetWidth / zoom ?? 0,
      height: element.offsetHeight / zoom ?? 0,
    })
  }, [zoom])

  useImperativeHandle(
    handlerRef,
    () => ({
      getZoomComponentSizes,
    }),
    [getZoomComponentSizes],
  )

  return (
    <>
      <div
        className={clsx('flex h-max w-full', active ? 'invisible' : 'visible')}
        ref={renderElementRef}
      >
        {/* @ts-ignore */}
        <Component {...componentProps} />
      </div>

      <div
        className={clsx(
          'absolute bottom-0 right-0 -z-10 xl:hidden',
          active ? 'visible' : 'invisible',
        )}
        style={{
          transform: `translate(${Math.min(
            Math.max(itemPosition.x, 0),
            mediaSize.width / 2,
          )}px, ${Math.min(Math.max(itemPosition.y, 0), mediaSize.height / 2)}px)`,
          height: mediaSize.height,
        }}
      >
        {/* @ts-ignore */}
        <Component
          {...componentProps}
          style={{
            ...componentProps.style,
            height: mediaSize.height,
            width: mediaSize.width,
          }}
        />
      </div>

      <div
        className={clsx(
          'absolute left-0 top-0 -z-10 hidden xl:block',
          active ? 'visible' : 'invisible',
        )}
        style={{
          transform: `translate(${-activePosition.x}px, ${-activePosition.y}px)`,
          height: mediaSize.height,
        }}
      >
        {/* @ts-ignore */}
        <Component
          {...componentProps}
          style={{
            ...componentProps.style,
            height: mediaSize.height,
            width: mediaSize.width,
          }}
        />
      </div>
    </>
  )
}
