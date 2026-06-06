def obj_to_dict(results):
    # takes scalars object as input
    if not results:
        return {}
    results_list = []
    try:
        for r in results.mappings():
            results_list.append(dict(r))
    except:
        print('Could not convert to dictionary.')
        return {}
    return results_list