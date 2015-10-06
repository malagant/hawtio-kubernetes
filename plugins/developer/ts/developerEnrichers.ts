/// <reference path="../../includes.ts"/>
module Developer {

  export function enrichWorkspaces(projects) {
    angular.forEach(projects, (project) => {
      enrichWorkspace(project);
    });
    return projects;
  }

  export function enrichWorkspace(build) {
    if (build) {
      var name = Kubernetes.getName(build);
      build.$name = name;
      build.$sortOrder = 0 - build.number;

      var nameArray = name.split("-");
      var nameArrayLength = nameArray.length;
      build.$shortName = (nameArrayLength > 4) ? nameArray.slice(0, nameArrayLength - 4).join("-") : name.substring(0, 30);

      var labels = Kubernetes.getLabels(build);
      build.$creationDate = asDate(Kubernetes.getCreationTimestamp(build));
      build.$labelsText = Kubernetes.labelsToString(labels);

      if (name) {
        build.$projectsLink = UrlHelpers.join("workspaces", name);
        build.$runtimeLink = UrlHelpers.join("kubernetes/namespace/", name, "/apps");
        build.$viewLink = build.$projectsLink;
      }
    }
    return build;
  }

  function asDate(value) {
    return value ? new Date(value) : null;
  }

  export function enrichJenkinsJob(job, projectId) {
    if (job) {
      job.$project = projectId;
      angular.forEach(job.builds, (build) => {
        enrichJenkinsBuild(job, build);
      });
    }
    return job;
  }

  export function createBuildStatusIconClass(result) {
    var $iconClass = "fa fa-spinner fa-spin";
    if (result) {
      if (result === "FAILURE" || result === "FAILED") {
        // TODO not available yet
        $iconClass = "fa fa-exclamation-circle red";
      } else if (result === "ABORTED" || result === "INTERUPTED") {
        $iconClass = "fa fa-circle grey";
      } else if (result === "SUCCESS") {
        $iconClass = "fa fa-check-circle green";
      } else if (result === "NOT_STARTED") {
        $iconClass = "fa fa-circle-thin grey";
      }
    }
    return $iconClass;
  }

  export function createBuildStatusBackgroundClass(result) {
    var $iconClass = "build-pending";
    if (result) {
      if (result === "FAILURE" || result === "FAILED") {
        $iconClass = "build-fail";
      } else if (result === "ABORTED" || result === "INTERUPTED") {
        $iconClass = "build-aborted";
      } else if (result === "SUCCESS") {
        $iconClass = "build-success";
      } else if (result === "NOT_STARTED") {
        $iconClass = "build-not-started";
      }
    }
    return $iconClass;
  }

  export function enrichJenkinsBuild(job, build) {
    if (build) {
      build.$duration = build.duration;
      build.$timestamp = asDate(build.timestamp);
      var jobName = job.name;
      var buildId = build.id;

      var $iconClass = createBuildStatusIconClass(build.result);
      var jobUrl = (job || {}).url;
      if (!jobUrl || !jobUrl.startsWith("http")) {
        var jenkinsUrl = jenkinsLink();
        if (jenkinsUrl) {
          jobUrl = UrlHelpers.join(jenkinsUrl, "job", jobName)
        }
      }
      if (jobUrl) {
        build.$jobLink = jobUrl;
        if (buildId) {
          build.$buildLink = UrlHelpers.join(jobUrl, build.id);
          build.$logsLink = UrlHelpers.join(build.$buildLink, "console");
          var workspaceName = Kubernetes.currentKubernetesNamespace();
          build.$pipelineLink = UrlHelpers.join("/workspaces", workspaceName, "projects", job.$project, "jenkinsJob", jobName, "pipeline", buildId);
        }
      }
      build.$iconClass = $iconClass;
    }
  }


  export function jenkinsLink() {
    var ServiceRegistry = Kubernetes.inject("ServiceRegistry");
    if (ServiceRegistry) {
      return ServiceRegistry.serviceLink(jenkinsServiceName);
    }
    return null;
  }

  export function enrichJenkinsPipelineJob(job) {
    if (job) {
      angular.forEach(job.builds, (build) => {
        enrichJenkinsStages(build);
      });
    }
  }

  export function enrichJenkinsStages(build) {
    if (build) {
      var parameters = build.parameters;
      var $parameterCount = 0;
      var $parameterText = "No parameters";
      if (parameters) {
        $parameterCount = _.keys(parameters).length || 0;
        $parameterText = Kubernetes.labelsToString(parameters, " ");
      }
      build.$parameterCount = $parameterCount;
      build.$parameterText = $parameterText;
      var jenkinsUrl = jenkinsLink();
      if (jenkinsUrl) {
        var url = build.url;
        if (url) {
          build.$viewLink = UrlHelpers.join(jenkinsUrl, url);
          build.$logLink = UrlHelpers.join(build.$viewLink, "log");
        }
      }

      angular.forEach(build.stages, (stage) => {
        enrichJenkinsStage(stage);
      });
    }
    return build;
  }

  export function enrichJenkinsStage(stage) {
    if (stage) {
      stage.$backgroundClass =  createBuildStatusBackgroundClass(stage.status);
      stage.$iconClass = createBuildStatusIconClass(stage.status);
      stage.$startTime = asDate(stage.startTime);
      if (!stage.duration) {
        stage.duration = 0;
      }
      var jenkinsUrl = jenkinsLink();
      if (jenkinsUrl) {
        var url = stage.url;
        if (url) {
          stage.$viewLink = UrlHelpers.join(jenkinsUrl, url);
          stage.$logLink = UrlHelpers.join(stage.$viewLink, "log");
        }
      }
    }
  }
}