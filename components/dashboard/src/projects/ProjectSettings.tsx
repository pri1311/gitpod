/**
 * Copyright (c) 2021 Gitpod GmbH. All rights reserved.
 * Licensed under the GNU Affero General Public License (AGPL).
 * See License-AGPL.txt in the project root for license information.
 */

import { useContext, useEffect, useState } from "react";
import { useLocation, useRouteMatch } from "react-router";
import { Project } from "@gitpod/gitpod-protocol";
import CheckBox from "../components/CheckBox";
import { getGitpodService } from "../service/service";
import { getCurrentTeam, TeamsContext } from "../teams/teams-context";
import Header from "../components/Header";

// eslint-disable-next-line import/no-anonymous-default-export
export default function () {
    const location = useLocation();
    const { teams } = useContext(TeamsContext);
    const team = getCurrentTeam(location, teams);
    const match = useRouteMatch<{ team: string, resource: string }>("/(t/)?:team/:resource");
    const projectSlug = match?.params?.resource;
    const [ project, setProject ] = useState<Project | undefined>();

    const [ isLoading, setIsLoading ] = useState<boolean>(true);
    const [ isIncrementalPrebuildsEnabled, setIsIncrementalPrebuildsEnabled ] = useState<boolean>(false);

    useEffect(() => {
        if (!teams || !projectSlug) {
            return;
        }
        (async () => {
            const projects = (!!team
                ? await getGitpodService().server.getTeamProjects(team.id)
                : await getGitpodService().server.getUserProjects());

            // Find project matching with slug, otherwise with name
            const project = projectSlug && projects.find(p => p.slug ? p.slug === projectSlug : p.name === projectSlug);
            if (!project) {
                return;
            }
            setProject(project);
        })();
    }, [ projectSlug, team, teams ]);

    useEffect(() => {
        if (!project) {
            return;
        }
        setIsLoading(false);
        setIsIncrementalPrebuildsEnabled(!!project.settings?.useIncrementalPrebuilds);
    }, [ project ]);

    const toggleIncrementalPrebuilds = async () => {
        if (!project) {
            return;
        }
        setIsLoading(true);
        try {
            await getGitpodService().server.updateProjectSettings(project.id, { useIncrementalPrebuilds: !isIncrementalPrebuildsEnabled });
            setIsIncrementalPrebuildsEnabled(!isIncrementalPrebuildsEnabled);
        } finally {
            setIsLoading(false);
        }
    }

    return <>
        <Header title="Settings" subtitle="Change your project settings." />
        <div className="app-container">
            <div className="mt-8">
                <h3>Incremental Prebuilds</h3>
                <p className="text-gray-500 pb-4">When possible, use an earlier successful prebuild as a base to create new prebuilds. This can make your prebuilds significantly faster, especially if they normally take longer than 10 minutes. <a className="gp-link" href="https://www.gitpod.io/changelog/faster-incremental-prebuilds">Learn more</a></p>
                <CheckBox title="Use Incremental Prebuilds (beta)" checked={isIncrementalPrebuildsEnabled} disabled={isLoading} onChange={toggleIncrementalPrebuilds} desc={""} />
            </div>
        </div>
    </>;
}