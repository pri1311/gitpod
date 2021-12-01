/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { getURLHash } from './App'

test('urlHash', () => {
    global.window = Object.create(window);
    Object.defineProperty(window, 'location', {
        value: {
            hash: '#example.org'
        }
    });

    expect(getURLHash()).toBe('example.org');
});