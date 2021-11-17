// Copyright (c) 2020 Gitpod GmbH. All rights reserved.
// Licensed under the GNU Affero General Public License (AGPL).
// See License-AGPL.txt in the project root for license information.

package ide

import (
	"context"
	"fmt"
	"testing"
	"time"

	"sigs.k8s.io/e2e-framework/pkg/envconf"
	"sigs.k8s.io/e2e-framework/pkg/features"

	agent "github.com/gitpod-io/gitpod/test/pkg/agent/workspace/api"
	"github.com/gitpod-io/gitpod/test/pkg/integration"
)

func TestPythonExtWorkspace(t *testing.T) {
	f := features.New("PythonExtensionWorkspace").
		WithLabel("component", "server").
		Assess("it can run python extension in a workspace", func(_ context.Context, t *testing.T, cfg *envconf.Config) context.Context {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
			defer cancel()

			api := integration.NewComponentAPI(ctx, cfg.Namespace(), cfg.Client())
			t.Cleanup(func() {
				api.Done(t)
			})

			nfo, stopWs, err := integration.LaunchWorkspaceFromContextURL(ctx, "github.com/jeanp413/python-test-workspace", username, api)
			if err != nil {
				t.Fatal(err)
			}
			defer stopWs(true)

			_, err = integration.WaitForWorkspaceStart(ctx, nfo.LatestInstance.ID, api)
			if err != nil {
				t.Fatal(err)
			}

			rsa, closer, err := integration.Instrument(integration.ComponentWorkspace, "workspace", cfg.Namespace(), cfg.Client(), integration.WithInstanceID(nfo.LatestInstance.ID))
			if err != nil {
				t.Fatal(err)
			}
			defer rsa.Close()
			integration.DeferCloser(t, closer)

			var resp agent.ExecResponse
			err = rsa.Call("WorkspaceAgent.Exec", &agent.ExecRequest{
				Dir:     "/workspace/python-test-workspace",
				Command: "yarn",
				Args: []string{
					"openvscode-server-test",
					fmt.Sprintf("--endpoint=%s", nfo.LatestInstance.IdeURL),
					"--workspacePath=./src/testWorkspace",
					"--extensionDevelopmentPath=./out",
					"--extensionTestsPath=./out/test/suite",
				},
			}, &resp)
			if err != nil {
				t.Fatal(err)
			}

			// if err != nil {
			// 	t.Fatal(err)
			// }
			// for _, f := range ls.Files {
			// 	t.Log(f)
			// }

			return ctx
		}).
		Feature()

	testEnv.Test(t, f)
}
