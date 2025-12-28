'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import { AlertCircle } from 'lucide-react';
import ZoomableContainer from './ZoomableContainer';

const scope = {
  React,
  useState,
  useEffect,
  useMemo,
};

export default function InteractiveRunner({ code }: { code: string }) {
  return (
    <ZoomableContainer className="my-3 rounded-lg border border-slate-700 bg-slate-900 overflow-hidden shadow-sm">
      <LiveProvider code={code} scope={scope} noInline={true}>
        <div className="bg-slate-900 text-slate-100 overflow-x-auto">
          <LivePreview />
        </div>
        <LiveError className="p-2 bg-red-900/50 text-red-200 text-sm font-mono border-t border-red-800" />
      </LiveProvider>
    </ZoomableContainer>
  );
}