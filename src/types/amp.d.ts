import React from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'amp-auto-ads': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                'type'?: string;
                'data-ad-client'?: string;
            };
        }
    }
}
